type WhatsAppButtonProps = {
  phone?: string;
  message?: string;
};

export default function WhatsAppButton({
  phone = '5521986668009',
  message = 'Olá Aurélio! Vim pelo site da Della Pace.',
}: WhatsAppButtonProps) {
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-105 active:scale-95"
    >
      <svg
        viewBox="0 0 32 32"
        className="h-7 w-7 text-white"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M16.001 3C9.373 3 4.001 8.372 4.001 15c0 2.117.553 4.18 1.604 5.997L4 28l7.18-1.587A12.95 12.95 0 0016 27c6.628 0 12-5.372 12-12S22.629 3 16.001 3zm0 21.667a9.65 9.65 0 01-4.92-1.346l-.353-.21-4.262.943.91-4.155-.23-.367A9.612 9.612 0 016.334 15c0-5.33 4.337-9.667 9.667-9.667S25.668 9.67 25.668 15s-4.337 9.667-9.667 9.667zm5.293-7.247c-.29-.145-1.717-.847-1.984-.943-.266-.097-.46-.145-.654.146-.193.29-.75.943-.92 1.137-.169.193-.339.218-.629.073-.29-.145-1.227-.452-2.337-1.443-.864-.77-1.448-1.722-1.618-2.013-.169-.29-.018-.447.127-.591.13-.13.29-.339.435-.508.145-.169.193-.29.29-.484.097-.193.048-.363-.024-.508-.072-.145-.654-1.578-.896-2.16-.236-.567-.476-.49-.654-.499l-.557-.01c-.193 0-.508.073-.774.363-.266.29-1.016.993-1.016 2.42 0 1.428 1.04 2.81 1.184 3.003.145.193 2.043 3.117 4.948 4.371.692.299 1.231.477 1.652.61.694.221 1.327.19 1.826.115.557-.083 1.717-.701 1.96-1.379.242-.677.242-1.258.169-1.379-.073-.121-.266-.193-.557-.339z" />
      </svg>
    </a>
  );
}
