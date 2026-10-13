export default function WhatsAppFloatingButton() {
  return (
    <a
      href="https://wa.me/6281234567890?text=Halo%20Aureate%20Craft,%20saya%20tertarik%20dengan%20produk%203D%20print%20custom"
      target="_blank"
      rel="noopener noreferrer"
      className="floating-wa-btn"
      id="btn-floating-wa"
      aria-label="Konsultasi WhatsApp Tanya Aureate Craft"
    >
      <span className="wa-pulse" />
      <span className="wa-icon-wrapper">
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="currentColor"
          className="wa-svg"
        >
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.541 1.905.814 2.791.814 3.18 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.768-5.766zm3.385 8.163c-.144.405-.837.774-1.17.822-.312.043-.679.071-1.992-.472-1.681-.696-2.76-2.42-2.845-2.532-.083-.113-.678-.902-.678-1.721 0-.819.429-1.222.581-1.389.153-.166.333-.209.444-.209.112 0 .223.002.321.008.105.005.244-.04.382.291.144.346.49 1.196.533 1.284.043.088.072.19.014.305-.058.115-.088.187-.174.288-.087.102-.183.227-.261.306-.089.088-.182.184-.078.362.105.178.468.772 1.005 1.25 1.037.925 1.547 1.056 1.768 1.166.222.11.353.093.484-.058.131-.151.558-.65.708-.874.149-.224.298-.187.5-.112.203.075 1.288.607 1.509.718.222.111.37.166.425.261.056.095.056.552-.088.957z" />
        </svg>
      </span>
      <span className="wa-text">Tanya Aureate</span>
    </a>
  );
}
