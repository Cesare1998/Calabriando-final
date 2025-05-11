import React from 'react';

interface ImageSelectorProps {
  value: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  category: 'home' | 'bb' | 'restaurants' | 'culture' | 'adventures' | 'tours' | 'experiences' | 'tour-tiles' | 'experience-tiles';
}

const IMAGE_CATEGORIES = {
  home: [
    { value: '/images/hero-1.jpg', label: 'Hero 1' },
    { value: '/images/hero-2.jpg', label: 'Hero 2' },
    { value: '/images/hero-3.jpg', label: 'Hero 3' },
    { value: '/images/hero-4.jpg', label: 'Hero 4' }
  ],
  bb: [
    { value: '/images/bb-1.jpg', label: 'B&B 1' },
    { value: '/images/bb-2.jpg', label: 'B&B 2' },
    { value: '/images/bb-3.jpg', label: 'B&B 3' }
  ],
  restaurants: [
    { value: '/images/restaurant-1.jpg', label: 'Ristorante 1' },
    { value: '/images/restaurant-2.jpg', label: 'Ristorante 2' },
    { value: '/images/restaurant-3.jpg', label: 'Ristorante 3' }
  ],
  culture: [
    { value: '/images/culture-1.jpg', label: 'Cultura 1' },
    { value: '/images/culture-2.jpg', label: 'Cultura 2' },
    { value: '/images/culture-3.jpg', label: 'Cultura 3' }
  ],
  adventures: [
    { value: '/images/horse-riding.jpg', label: 'Gite a cavallo' },
    { value: '/images/rafting.jpg', label: 'Rafting' },
    { value: '/images/quad.jpg', label: 'Quad' },
    { value: '/images/flight.jpg', label: 'Volo panoramico' },
    { value: '/images/diving.jpg', label: 'Immersioni' },
    { value: '/images/boat.jpg', label: 'Tour in barca' },
    { value: '/images/snorkeling.jpg', label: 'Snorkeling' }
  ],
  tours: [
    { value: '/images/city-tours.jpg', label: 'Tour Città' },
    { value: '/images/region-tours.jpg', label: 'Tour Regione' },
    { value: '/images/unique-tours.jpg', label: 'Tour Esperienze' }
  ],
  experiences: [
    { value: '/images/trekking.jpg', label: 'Trekking' },
    { value: '/images/gastronomy.jpg', label: 'Gastronomia' },
    { value: '/images/culture.jpg', label: 'Arte e Cultura' }
  ],
  'tour-tiles': [
    { value: '/images/city-tours.jpg', label: 'Tour Città' },
    { value: '/images/region-tours.jpg', label: 'Tour Regione' },
    { value: '/images/unique-tours.jpg', label: 'Tour Esperienze' }
  ],
  'experience-tiles': [
    { value: '/images/trekking.jpg', label: 'Trekking e Natura' },
    { value: '/images/gastronomy.jpg', label: 'Gastronomia' },
    { value: '/images/culture.jpg', label: 'Arte e Cultura' }
  ]
};

const ImageSelector = ({ value, onChange, maxImages = 5, category }: ImageSelectorProps) => {
  const handleImageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newImage = e.target.value;
    if (!newImage) return;

    const newImages = [...value];
    if (!newImages.includes(newImage) && newImages.length < maxImages) {
      newImages.push(newImage);
      onChange(newImages);
    }

    e.target.value = '';
  };

  const handleRemoveImage = (imageToRemove: string) => {
    const newImages = value.filter(img => img !== imageToRemove);
    onChange(newImages);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Failed to load image:', e.currentTarget.src);
    e.currentTarget.src = '/images/placeholder.jpg';
  };

  // Get available images (not already selected)
  const availableImages = IMAGE_CATEGORIES[category].filter(
    image => !value.includes(image.value)
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <select
          onChange={handleImageSelect}
          value=""
          className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Seleziona un'immagine</option>
          {availableImages.map((image) => (
            <option 
              key={image.value} 
              value={image.value}
            >
              {image.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {value.map((image) => {
          const imageInfo = IMAGE_CATEGORIES[category].find(img => img.value === image);
          return (
            <div key={image} className="flex items-center gap-4 bg-gray-50 p-2 rounded-lg">
              <img
                src={image}
                alt={imageInfo?.label || 'Selected image'}
                className="w-16 h-16 object-cover rounded"
                onError={handleImageError}
              />
              <span className="flex-1">{imageInfo?.label || 'Immagine selezionata'}</span>
              <button
                onClick={() => handleRemoveImage(image)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                type="button"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-gray-500">
        {value.length} / {maxImages} immagini selezionate
      </p>
    </div>
  );
};

export default ImageSelector;