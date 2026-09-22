const columns = [
  {
    title: "About wasla (وصلة)",
    links: ["Company Story & Mission", "Careers at wasla", "Press & Media Inquiries", "Sustainability & Impact"],
  },
  {
    title: "Customer Care",
    links: ["Help Center & FAQ", "Track Your Order", "Shipping & Delivery Rates", "100% Buyer Protection"],
  },
  {
    title: "Seller Center",
    links: ["Sell on wasla Marketplace", "Seller Hub & Analytics", "Advertise Your Products", "Fulfillment by wasla"],
  },
];

const socials = [
  { icon: "bi-facebook", label: "Facebook" },
  { icon: "bi-instagram", label: "Instagram" },
  { icon: "bi-twitter-x", label: "X" },
  { icon: "bi-youtube", label: "YouTube" },
];

const payments = ["Mada", "Visa", "Mastercard", "Apple Pay", "Tabby", "Tamara", "Cash on Delivery"];

export default function Footer() {
  return (
    <footer className="bg-white border-top mt-5">
      <div className="container py-5">
        <div className="row g-4">
          {columns.map(({ title, links }) => (
            <div key={title} className="col-6 col-lg-3">
              <h2 className="h6 fw-semibold mb-3">{title}</h2>
              <ul className="list-unstyled d-grid gap-2 mb-0">
                {links.map((text) => (
                  <li key={text}>
                    <a href="#" className="footer-link">{text}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-12 col-lg-3">
            <h2 className="h6 fw-semibold mb-3">Stay Connected</h2>
            <p className="small text-secondary">
              Subscribe to receive your instant 15% discount voucher on your first order.
            </p>
            <form className="input-group input-group-sm mb-3" onSubmit={(e) => e.preventDefault()}>
              <input type="email" className="form-control" placeholder="Enter your email..." aria-label="Email address" />
              <button className="btn btn-wasla" type="submit">Claim 15%</button>
            </form>
            <div className="d-flex gap-3 fs-5">
              {socials.map(({ icon, label }) => (
                <a key={label} href="#" className="footer-link fs-5" aria-label={label}>
                  <i className={`bi ${icon}`} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <hr className="my-4" />

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 small text-secondary">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <span>Trusted Payment Options:</span>
            {payments.map((p) => (
              <span key={p} className="badge text-bg-light border fw-medium">{p}</span>
            ))}
          </div>
          <span>© 2026 wasla. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
