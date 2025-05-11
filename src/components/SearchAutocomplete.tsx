import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface SearchResult {
  id: string;
  name?: string;
  title?: string;
  description: string;
  section?: string;
  section_group?: string;
  table_name: string;
  translations?: {
    [key: string]: {
      title: string;
      description: string;
    }
  };
}

interface SearchAutocompleteProps {
  placeholder: string;
  onSearch: (query: string) => void;
  className?: string;
}

export default function SearchAutocomplete({ placeholder, onSearch, className = '' }: SearchAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const isScrolled = window.scrollY > 50;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const tableConfigs = [
          {
            table: 'content',
            columns: 'id, title, description, section, section_group, translations',
            searchColumns: ['title', 'description']
          },
          {
            table: 'adventures',
            columns: 'id, title, description, adventure_type, translations',
            searchColumns: ['title', 'description']
          },
          {
            table: 'tours',
            columns: 'id, title, description, translations',
            searchColumns: ['title', 'description']
          },
          {
            table: 'cultural_sites',
            columns: 'id, name, description, type, translations',
            searchColumns: ['name', 'description']
          },
          {
            table: 'restaurants',
            columns: 'id, name, description, translations',
            searchColumns: ['name', 'description']
          },
          {
            table: 'bb',
            columns: 'id, name, description, translations',
            searchColumns: ['name', 'description']
          }
        ];

        const searchPromises = tableConfigs.map(async (config) => {
          const { data, error } = await supabase
            .from(config.table)
            .select(config.columns)
            .or(
              config.searchColumns.map(column => 
                `${column}.ilike.%${query}%`
              ).join(',')
            )
            .limit(3);

          if (error) {
            console.error(`Error searching ${config.table}:`, error);
            return [];
          }

          return (data || []).map(item => {
            // Handle translations
            const translatedTitle = item.translations?.[language]?.title || item.title || item.name;
            const translatedDescription = item.translations?.[language]?.description || item.description;

            return {
              ...item,
              title: translatedTitle,
              description: translatedDescription,
              table_name: config.table
            };
          });
        });

        const searchResults = await Promise.all(searchPromises);
        setResults(searchResults.flat());
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [query, language]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setShowResults(false);
    onSearch(query);
  };

  const handleResultClick = (result: SearchResult) => {
    let path = '';
    switch (result.table_name) {
      case 'content':
        // Handle content sections appropriately
        if (result.section_group === 'experiences') {
          if (result.section === 'experience-trekking') {
            path = '/trekking';
          } else if (result.section === 'experience-food') {
            path = '/gastronomy';
          } else if (result.section === 'experience-culture') {
            path = '/culture';
          } else {
            path = '/#experiences';
          }
        } else if (result.section_group === 'hero') {
          path = '/#hero';
        } else {
          path = '/';
        }
        break;
      case 'adventures':
        path = `/adventure/detail/${result.id}`;
        break;
      case 'tours':
        path = `/tour/${result.id}`;
        break;
      case 'cultural_sites':
        path = `/culture#${result.id}`;
        break;
      case 'restaurants':
        path = `/restaurants#${result.id}`;
        break;
      case 'bb':
        path = `/bb#${result.id}`;
        break;
    }
    navigate(path);
    setShowResults(false);
    setQuery('');
  };

  const getTableName = (tableName: string, result: SearchResult) => {
    // Special handling for content sections
    if (tableName === 'content' && result.section_group === 'experiences') {
      return language === 'it' ? 'Esperienze' : 'Experiences';
    }

    const translations: { [key: string]: { it: string; en: string } } = {
      content: { it: 'Contenuti', en: 'Content' },
      adventures: { it: 'Avventure', en: 'Adventures' },
      tours: { it: 'Tour', en: 'Tours' },
      cultural_sites: { it: 'Siti Culturali', en: 'Cultural Sites' },
      restaurants: { it: 'Ristoranti', en: 'Restaurants' },
      bb: { it: 'B&B', en: 'B&B' }
    };

    return translations[tableName]?.[language] || tableName;
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder={placeholder}
            className={`w-full pl-4 pr-10 py-2 rounded-full ${
              isScrolled 
                ? 'bg-gray-100 text-gray-700 placeholder-gray-500 border border-gray-200 focus:border-primary-500' 
                : 'bg-white/10 text-white placeholder-white/70 border border-white/30 focus:border-white/50'
            } focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all duration-300`}
          />
          <button 
            type="submit"
            className={`absolute right-3 top-1/2 -translate-y-1/2 ${
              isScrolled ? 'text-gray-500 hover:text-primary-600' : 'text-white/70 hover:text-white'
            }`}
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </form>

      {showResults && (query.trim().length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg overflow-hidden z-50 border border-gray-200 shadow-xl">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              {language === 'it' ? 'Ricerca in corso...' : 'Searching...'}
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {results.map((result) => (
                <button
                  key={`${result.table_name}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="text-sm font-medium text-gray-800">
                    {result.title || result.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {result.description}
                  </div>
                  <div className="text-xs text-primary-600 mt-1">
                    {getTableName(result.table_name, result)}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              {query.trim().length >= 2 
                ? (language === 'it' ? 'Nessun risultato trovato' : 'No results found')
                : (language === 'it' ? 'Digita per cercare' : 'Type to search')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}