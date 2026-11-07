<?php
// Google Analytics 4. Sertakan file ini sekali di dalam <head> setiap halaman publik.
const GA4_MEASUREMENT_ID = 'G-RYDSX3B82S';
?>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=<?= GA4_MEASUREMENT_ID ?>"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '<?= GA4_MEASUREMENT_ID ?>');

// Catat setiap klik pada <a> dan <button> sebagai event "klik_link"
document.addEventListener('click', function (e) {
  var el = e.target.closest && e.target.closest('a, button');
  if (!el) return;
  var text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim()
    || el.getAttribute('aria-label') || el.getAttribute('title') || '';
  var url = el.tagName === 'A' ? (el.href || '') : (el.form && el.type === 'submit' ? el.form.action : '');
  gtag('event', 'klik_link', {
    link_text: text.slice(0, 100),
    link_url: url,
    halaman: location.pathname
  });
}, true);
</script>
