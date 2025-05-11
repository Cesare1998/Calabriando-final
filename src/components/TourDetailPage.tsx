// ... (previous imports remain the same)

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!tour || !formData.date || !formData.paymentMethod) return;

  try {
    const dateStr = format(formData.date, 'yyyy-MM-dd');
    const timeRange = tour.available_dates.find(d => d.date === dateStr)?.time;

    if (!timeRange) return;

    const bookingData = {
      tour_id: tour.id,
      user_email: formData.email,
      user_name: formData.name,
      user_phone: formData.phone,
      booking_date: dateStr,
      booking_time: timeRange,
      participants: formData.participants,
      total_price: tour.price * formData.participants,
      payment_method: formData.paymentMethod,
      payment_status: 'pending'
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();

    if (error) throw error;

    // Send confirmation email
    const emailResponse = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-booking-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ 
          bookingId: data.id,
          type: 'tour'
        }),
      }
    );

    if (!emailResponse.ok) {
      console.error('Failed to send confirmation email');
    }

    const pdf = generatePDF(data);
    const blob = pdf.output('blob');
    setPdfBlob(blob);
    setBookingReference(data.id);

    if (formData.paymentMethod === 'paypal') {
      window.location.href = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=info@calabriando.it&item_name=${encodeURIComponent(tour.translations[language].title)}&amount=${tour.price * formData.participants}&currency_code=EUR&invoice=${data.id}`;
    } else if (formData.paymentMethod === 'bank') {
      setShowConfirmation(true);
    } else {
      setShowPayment(true);
    }

  } catch (err) {
    console.error('Error booking tour:', err);
    alert(language === 'it'
      ? 'Errore durante la prenotazione. Riprova.'
      : 'Error during booking. Please try again.');
  }
};

// ... (rest of the file remains the same)