import React, { createContext, useContext, useState } from 'react';

type Language = 'it' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  it: {
    // Navigation
    'nav.destinations': 'Destinazioni',
    'nav.experiences': 'I Nostri Suggerimenti',
    'nav.tours': 'Tour',
    'nav.food': 'Gastronomia',
    'nav.contacts': 'Contatti',
    'nav.bb': 'B&B',
    'nav.restaurants': 'Ristoranti',
    'nav.culture': 'Arte & Cultura',
    'nav.team': 'Team Calabriando',
    
    // Hero Section
    'hero.tropea.title': 'Tropea',
    'hero.tropea.description': 'La perla del Mediterraneo con le sue spiagge cristalline',
    'hero.sila.title': 'Sila',
    'hero.sila.description': 'Natura incontaminata e paesaggi mozzafiato',
    'hero.costa.title': 'Costa degli Dei',
    'hero.costa.description': 'Un paradiso tra cielo e mare',
    'hero.borghi.title': 'Borghi Antichi',
    'hero.borghi.description': 'Storia e tradizione si fondono in un\'esperienza unica',

    // Sila Section
    'sila.title': 'Parco Nazionale della Sila',
    'sila.description': 'Un paradiso naturale che si estende per oltre 73.000 ettari, con foreste millenarie, laghi cristallini e una biodiversità unica. Il luogo perfetto per gli amanti del trekking e della natura incontaminata.',
    'sila.cta': 'Scopri la Sila',

    // Experiences
    'experiences.title': 'I Nostri Suggerimenti',
    'experiences.trekking': 'Trekking e Natura',
    'experiences.trekking.desc': 'Esplora sentieri secolari tra boschi e montagne',
    'experiences.food': 'Gastronomia',
    'experiences.food.desc': 'Assapora i sapori autentici della tradizione calabrese',
    'experiences.culture': 'Arte e Cultura',
    'experiences.culture.desc': 'Scopri la ricca storia della Magna Grecia',

    // Tours
    'tours.title': 'Tour Organizzati',
    'tours.duration': 'Durata',
    'tours.maxParticipants': 'Max partecipanti',
    'tours.price': 'per persona',
    'tours.book': 'Prenota Ora',
    'tours.back': 'Torna ai tour',
    'tours.bookingTitle': 'Prenota il tuo tour',
    'tours.date': 'Data del Tour',
    'tours.selectDate': 'Seleziona una data',
    'tours.participants': 'Numero di Partecipanti',
    'tours.name': 'Nome Completo',
    'tours.email': 'Email',
    'tours.phone': 'Telefono',
    'tours.total': 'Totale',
    'tours.proceed': 'Procedi al Pagamento',
    'tours.paymentMethods': 'Scegli il metodo di pagamento',
    'tours.paymentTotal': 'Totale da pagare',
    'tours.creditCard': 'Paga con Carta di Credito',
    'tours.or': 'oppure',
    'tours.availableDates': 'Date Disponibili',
    'tours_page': 'Tour ed Esperienze',

    // CTA Section
    'cta.title': 'Pronti per l\'Avventura?',
    'cta.description': 'Lasciati conquistare dalla Calabria. Pianifica ora il tuo viaggio e scopri una terra ricca di sorprese.',
    'cta.contact': 'Contattaci',
    'cta.discover': 'Scopri di più',

    // Footer
    'footer.description': 'La tua guida per scoprire le meraviglie della Calabria',
    'footer.quickLinks': 'Collegamenti Rapidi',
    'footer.home': 'Home',
    'footer.destinations': 'Destinazioni',
    'footer.experiences': 'I Nostri Suggerimenti',
    'footer.contacts': 'Contatti',
    'footer.contact': 'Contatti',
    'footer.location': 'Calabria, Italia',
    'footer.openHours': 'Aperto tutto l\'anno',
    'footer.newsletter': 'Newsletter',
    'footer.subscribe': 'Iscriviti per ricevere aggiornamenti e offerte speciali',
    'footer.email': 'La tua email',
    'footer.subscribeButton': 'Iscriviti',

    // B&B Page
    'bb.title': 'B&B Consigliati',
    'bb.location': 'Posizione',
    'bb.price': 'Prezzo per notte',
    'bb.contacts': 'Contatti',
    'bb.book': 'Prenota Ora',
    'bb.perNight': 'a notte',

    // Restaurants Page
    'restaurants.title': 'Ristoranti Consigliati',
    'restaurants.cuisine': 'Cucina',
    'restaurants.priceRange': 'Fascia di Prezzo',
    'restaurants.contacts': 'Contatti',
    'restaurants.reserve': 'Prenota un Tavolo',

    // Culture Page
    'culture.title': 'Arte & Cultura',
    'culture.type': 'Tipo',
    'culture.period': 'Periodo',
    'culture.location': 'Posizione',
    'culture.visit': 'Pianifica la Visita',
    
    // Team Page
    'team.title': 'Il Nostro Team',
    'team.subtitle': 'Conosci le persone che rendono possibile Calabriando',
    'team.joinUs': 'Unisciti a Noi',
    'team.joinUsText': 'Sei appassionato della Calabria e vuoi far parte del nostro team? Contattaci per scoprire le opportunità disponibili.',
    'team.contact': 'Contattaci'
  },
  en: {
    // Navigation
    'nav.destinations': 'Destinations',
    'nav.experiences': 'Our Suggestions',
    'nav.tours': 'Tours',
    'nav.food': 'Food',
    'nav.contacts': 'Contact',
    'nav.bb': 'B&B',
    'nav.restaurants': 'Restaurants',
    'nav.culture': 'Art & Culture',
    'nav.team': 'Calabriando Team',

    // Hero Section
    'hero.tropea.title': 'Tropea',
    'hero.tropea.description': 'The Mediterranean pearl with its crystal-clear beaches',
    'hero.sila.title': 'Sila',
    'hero.sila.description': 'Untouched nature and breathtaking landscapes',
    'hero.costa.title': 'Costa degli Dei',
    'hero.costa.description': 'A paradise between sky and sea',
    'hero.borghi.title': 'Ancient Villages',
    'hero.borghi.description': 'History and tradition blend in a unique experience',

    // Sila Section
    'sila.title': 'Sila National Park',
    'sila.description': 'A natural paradise spanning over 73,000 hectares, with ancient forests, crystal-clear lakes, and unique biodiversity. The perfect place for hiking and untouched nature lovers.',
    'sila.cta': 'Discover Sila',

    // Experiences
    'experiences.title': 'Our Suggestions',
    'experiences.trekking': 'Trekking & Nature',
    'experiences.trekking.desc': 'Explore ancient trails through woods and mountains',
    'experiences.food': 'Gastronomy',
    'experiences.food.desc': 'Taste the authentic flavors of Calabrian tradition',
    'experiences.culture': 'Art & Culture',
    'experiences.culture.desc': 'Discover the rich history of Magna Graecia',

    // Tours
    'tours.title': 'Organized Tours',
    'tours.duration': 'Duration',
    'tours.maxParticipants': 'Max participants',
    'tours.price': 'per person',
    'tours.book': 'Book Now',
    'tours.back': 'Back to tours',
    'tours.bookingTitle': 'Book your tour',
    'tours.date': 'Tour Date',
    'tours.selectDate': 'Select a date',
    'tours.participants': 'Number of Participants',
    'tours.name': 'Full Name',
    'tours.email': 'Email',
    'tours.phone': 'Phone',
    'tours.total': 'Total',
    'tours.proceed': 'Proceed to Payment',
    'tours.paymentMethods': 'Choose payment method',
    'tours.paymentTotal': 'Total to pay',
    'tours.creditCard': 'Pay with Credit Card',
    'tours.or': 'or',
    'tours.availableDates': 'Available Dates',
    'tours_page': 'Tours and Experiences',

    // CTA Section
    'cta.title': 'Ready for Adventure?',
    'cta.description': 'Let Calabria captivate you. Plan your journey now and discover a land full of surprises.',
    'cta.contact': 'Contact Us',
    'cta.discover': 'Discover More',

    // Footer
    'footer.description': 'Your guide to discovering the wonders of Calabria',
    'footer.quickLinks': 'Quick Links',
    'footer.home': 'Home',
    'footer.destinations': 'Destinations',
    'footer.experiences': 'Our Suggestions',
    'footer.contacts': 'Contact',
    'footer.contact': 'Contact',
    'footer.location': 'Calabria, Italy',
    'footer.openHours': 'Open all year',
    'footer.newsletter': 'Newsletter',
    'footer.subscribe': 'Subscribe to receive updates and special offers',
    'footer.email': 'Your email',
    'footer.subscribeButton': 'Subscribe',

    // B&B Page
    'bb.title': 'Recommended B&Bs',
    'bb.location': 'Location',
    'bb.price': 'Price per night',
    'bb.contacts': 'Contacts',
    'bb.book': 'Book Now',
    'bb.perNight':'per night',

    // Restaurants Page
    'restaurants.title': 'Recommended Restaurants',
    'restaurants.cuisine': 'Cuisine',
    'restaurants.priceRange': 'Price Range',
    'restaurants.contacts': 'Contacts',
    'restaurants.reserve': 'Book a Table',

    // Culture Page
    'culture.title': 'Art & Culture',
    'culture.type': 'Type',
    'culture.period': 'Period',
    'culture.location': 'Location',
    'culture.visit': 'Plan Your Visit',
    
    // Team Page
    'team.title': 'Our Team',
    'team.subtitle': 'Meet the people who make Calabriando possible',
    'team.joinUs': 'Join Us',
    'team.joinUsText': 'Are you passionate about Calabria and want to be part of our team? Contact us to discover available opportunities.',
    'team.contact': 'Contact Us'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('it');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['it']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}