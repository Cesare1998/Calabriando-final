import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { Clock, Users, Euro, MapPin, Home } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { it } from 'date-fns/locale';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import "react-datepicker/dist/react-datepicker.css";
import LanguageSwitcher from '../components/LanguageSwitcher';
import PageBackground from '../components/PageBackground';

interface Adventure {
  id: string;
  title: string;
  description: string;
  image_url: string;
  duration: string;
  price: number;
  max_participants: number;
  available_dates: Array<{
    date: string;
    time: [string, string];
  }>;
  location: string;
  adventure_type: string;
  translations: {
    it: {
      title: string;
      description: string;
    };
    en: {
      title: string;
      description: string;
    };
  };
}

interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  date: Date | null;
  participants: number;
}

export default function AdventureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<BookingFormData>({
    name: '',
    email: '',
    phone: '',
    date: null,
    participants: 1
  });

  useEffect(() => {
    loadAdventure();
  }, [id]);

  const loadAdventure = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('adventures')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setAdventure(data);
    } catch (err) {
      console.error('Error loading adventure:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateBookingId = () => {
    const timestamp = Date.now().toString(36);
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    return `BK-${timestamp}-${randomSuffix}`;
  };

  const generatePDF = async (bookingData: any) => {
    const doc = new jsPDF();
    
    // Add logo
    doc.addImage('/calabriando-blue.png', 'PNG', 150, 10, 40, 40);
    
    doc.setFontSize(20);
    doc.text('Calabriando Adventure Booking', 20, 20);
    
    doc.setFontSize(12);
    doc.text('Booking Details:', 20, 40);
    
    const details = [
      ['Adventure', adventure?.translations[language].title || ''],
      ['Date', format(new Date(bookingData.booking_date), 'dd/MM/yyyy')],
      ['Time', `${bookingData.booking_time[0]} - ${bookingData.booking_time[1]}`],
      ['Participants', bookingData.participants.toString()],
      ['Total Price', `€${bookingData.total_price}`],
      ['Booking Reference', bookingData.id],
      ['Customer Name', bookingData.user_name],
      ['Customer Email', bookingData.user_email],
      ['Customer Phone', bookingData.user_phone]
    ];

    (doc as any).autoTable({
      startY: 50,
      head: [['Item', 'Detail']],
      body: details,
      theme: 'striped',
      headStyles: { fillColor: [0, 87, 183] }
    });

    // Generate QR code
    const qrData = await QRCode.toDataURL(JSON.stringify({
      bookingId: bookingData.id,
      adventureId: adventure?.id,
      date: bookingData.booking_date,
      time: bookingData.booking_time,
      participants: bookingData.participants
    }));

    // Add QR code
    doc.addImage(qrData, 'PNG', 70, 180, 60, 60);
    doc.setFontSize(10);
    doc.text('Scan to verify booking', 70, 250);

    return doc;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adventure || !formData.date) return;

    try {
      const dateStr = format(formData.date, 'yyyy-MM-dd');
      const timeRange = adventure.available_dates.find(d => d.date === dateStr)?.time;

      if (!timeRange) return;

      const bookingId = generateBookingId();
      const totalAmount = adventure.price * formData.participants;

      const bookingData = {
        id: bookingId,
        adventure_id: adventure.id,
        user_email: formData.email,
        user_name: formData.name,
        user_phone: formData.phone,
        booking_date: dateStr,
        booking_time: timeRange,
        participants: formData.participants,
        total_price: totalAmount,
        payment_method: 'cash',
        payment_status: 'pending'
      };

      const { data: booking, error: bookingError } = await supabase
        .from('adventure_bookings')
        .insert([bookingData])
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Generate PDF with QR code
      const pdf = await generatePDF(booking);
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Download PDF
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `booking-confirmation-${bookingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Send confirmation email with PDF
      const emailResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-booking-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ 
            bookingId,
            type: 'adventure'
          }),
        }
      );

      if (!emailResponse.ok) {
        throw new Error('Failed to send confirmation email');
      }

      alert(language === 'it'
        ? 'Prenotazione confermata! Controlla la tua email per la ricevuta.'
        : 'Booking confirmed! Check your email for the receipt.');

      navigate('/');

    } catch (err) {
      console.error('Error booking adventure:', err);
      alert(language === 'it'
        ? 'Errore durante la prenotazione. Riprova.'
        : 'Error during booking. Please try again.');
    }
  };

  const getTimeDisplay = () => {
    if (!adventure?.available_dates || !formData.date) return '';
    
    const dateStr = format(formData.date, 'yyyy-MM-dd');
    const dateData = adventure.available_dates.find(d => d.date === dateStr);
    
    if (!dateData) return '';
    return ` - ${dateData.time[0]}-${dateData.time[1]}`;
  };

  if (loading) {
    return (
      <PageBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl">Caricamento...</div>
        </div>
      </PageBackground>
    );
  }

  if (!adventure) {
    return (
      <PageBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl text-red-600">Avventura non trovata</div>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground>
      <div className="min-h-screen pt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg text-black hover:bg-gray-100 transition"
              aria-label="Home"
            >
              <Home className="w-5 h-5" />
            </button>
            <LanguageSwitcher />
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="relative h-96">
              <img 
                src={adventure.image_url}
                alt={adventure.translations[language].title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h1 className="text-4xl font-bold text-white mb-2">
                  {adventure.translations[language].title}
                </h1>
                <div className="flex items-center gap-2 text-white">
                  <MapPin className="w-5 h-5" />
                  <span>{adventure.location}</span>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <h2 className="text-2xl font-bold mb-4">
                    {language === 'it' ? 'Descrizione dell\'Avventura' : 'Adventure Description'}
                  </h2>
                  <p className="text-gray-600 mb-6 whitespace-pre-line">
                    {adventure.translations[language].description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Clock className="w-5 h-5" />
                        <span className="text-sm font-medium">{language === 'it' ? 'Durata' : 'Duration'}</span>
                      </div>
                      <span className="text-lg font-semibold">{adventure.duration}{getTimeDisplay()}</span>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Users className="w-5 h-5" />
                        <span className="text-sm font-medium">{language === 'it' ? 'Max Partecipanti' : 'Max Participants'}</span>
                      </div>
                      <span className="text-lg font-semibold">{adventure.max_participants}</span>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Euro className="w-5 h-5" />
                        <span className="text-sm font-medium">{language === 'it' ? 'Prezzo' : 'Price'}</span>
                      </div>
                      <span className="text-lg font-semibold">{adventure.price}€ {language === 'it' ? 'a persona' : 'per person'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-4">
                    {language === 'it' ? 'Prenota l\'Avventura' : 'Book the Adventure'}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {language === 'it' ? 'Data' : 'Date'}
                      </label>
                      <DatePicker
                        selected={formData.date}
                        onChange={(date) => setFormData({ ...formData, date })}
                        dateFormat="dd/MM/yyyy"
                        minDate={new Date()}
                        includeDates={adventure.available_dates?.map(d => new Date(d.date))}
                        locale={language === 'it' ? it : undefined}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholderText={language === 'it' ? 'Seleziona una data' : 'Select a date'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {language === 'it' ? 'Partecipanti' : 'Participants'}
                      </label>
                      <select
                        value={formData.participants}
                        onChange={(e) => setFormData({ ...formData, participants: Number(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {Array.from({ length: adventure.max_participants }, (_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {language === 'it' ? 'Nome' : 'Name'}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {language === 'it' ? 'Email' : 'Email'}
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {language === 'it' ? 'Telefono' : 'Phone'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-600">{language === 'it' ? 'Totale' : 'Total'}</span>
                        <span className="text-2xl font-bold">
                          {adventure.price * formData.participants}€
                        </span>
                      </div>

                      <button
                        type="submit"
                        disabled={!formData.date}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {language === 'it' ? 'Prenota Ora' : 'Book Now'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageBackground>
  );
}