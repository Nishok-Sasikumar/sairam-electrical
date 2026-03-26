import { Twitter, Facebook, Instagram, Github, Mail, MapPin, Phone } from "lucide-react"
import { Link } from "react-router-dom"
import { useTranslation } from 'react-i18next'

function Footer() {
  const { t } = useTranslation()

  const sections = [
    {
      title: t('footer.about_us'),
      links: [
        { label: t('footer.about_sairam'), to: "/about" },
        { label: t('footer.careers'), to: "/careers" },
        { label: t('footer.press'), to: "/press" },
      ]
    },
    {
      title: t('footer.help'),
      links: [
        { label: t('footer.payments'), to: "/payments" },
        { label: t('footer.shipping'), to: "/shipping" },
        { label: t('footer.cancellation_returns'), to: "/returns" },
        { label: t('footer.faq'), to: "/faq" },
      ]
    },
    {
      title: t('footer.policy'),
      links: [
        { label: t('footer.return_policy'), to: "/returns" },
        { label: t('footer.terms_of_use'), to: "/terms" },
        { label: t('footer.security'), to: "/security" },
        { label: t('footer.privacy'), to: "/privacy" },
        { label: t('footer.sitemap'), to: "/sitemap" },
      ]
    },
    {
      title: t('footer.social'),
      links: [
        { label: "Facebook", to: "#", icon: Facebook },
        { label: "Twitter", to: "#", icon: Twitter },
        { label: "Instagram", to: "#", icon: Instagram },
        { label: "Github", to: "#", icon: Github },
      ]
    }
  ]

  return (
    <footer className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-16">
          {sections.map((section, index) => (
            <div key={index}>
              <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, idx) => (
                  <li key={idx}>
                    <Link to={link.to} className="text-sm font-medium hover:text-primary dark:hover:text-white transition-colors flex items-center gap-2">
                      {link.icon && <link.icon size={16} />}
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="col-span-2 md:col-span-1 border-l border-slate-200 dark:border-white/10 pl-8">
            <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-4">{t('footer.registered_office')}</h4>
            <address className="not-italic text-sm space-y-3">
              <p className="flex items-start gap-3">
                <MapPin size={16} className="mt-1 flex-shrink-0 text-slate-400" />
                <span>SAI RAM Traders, 123 Main Street, Madurai, Tamil Nadu, 625001</span>
              </p>
              <p className="flex items-start gap-3">
                <Mail size={14} className="mt-1 flex-shrink-0 text-slate-400" />
                <a href="mailto:support@sairam.com" className="hover:text-primary dark:hover:text-white">support@sairam.com</a>
              </p>
              <p className="flex items-start gap-3">
                <Phone size={14} className="mt-1 flex-shrink-0 text-slate-400" />
                <a href="tel:+911234567890" className="hover:text-primary dark:hover:text-white">+91 12345 67890</a>
              </p>
            </address>
          </div>
        </div>
        <div className="border-t border-slate-200 dark:border-white/10 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-medium">
            © 2024 {t('nav.brand_part1')} {t('nav.brand_part2')} {t('nav.traders')}. {t('footer.rights')}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium">{t('footer.payment_methods')}:</span>
            <div className="flex items-center gap-3">
              <img src="https://img.icons8.com/color/48/visa.png" alt="Visa" className="h-6" />
              <img src="https://img.icons8.com/color/48/mastercard.png" alt="Mastercard" className="h-6" />
              <img src="https://img.icons8.com/color/48/rupay.png" alt="Rupay" className="h-6" />
              <img src="https://img.icons8.com/color/48/google-pay.png" alt="Google Pay" className="h-6" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
