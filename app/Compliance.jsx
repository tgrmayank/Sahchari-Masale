'use client';
import { useEffect, useState } from 'react';

/* ---------- consent storage ---------- */
export const CK = 'sm_cookie';
export const readCk = () => { try { return JSON.parse(localStorage.getItem(CK)); } catch { return null; } };
export const rememberOk = () => { const c = readCk(); return !!(c && c.remember === true); };
export const logConsent = (what) => {
  try { localStorage.setItem('sm_consent', JSON.stringify({ what, t: new Date().toISOString(), v: 1 })); } catch {}
};

/* Change these two lines to the real person who handles privacy complaints */
export const GRIEVANCE = { name: 'Proprietor, SAHCHARI MASALE', reply: 'within 7 days' };
export const REPORT_WINDOW = '48 hours';

/* ---------- cookie / local storage banner ---------- */
const CSS = `.ckb{position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#2d0707;color:#fff;padding:14px 16px calc(14px + env(safe-area-inset-bottom));box-shadow:0 -6px 24px #0006;border-top:2px solid #d9a21b;font-size:13px;line-height:1.55}
.ckb .in{max-width:900px;margin:auto}.ckb b{color:#ffd978}.ckb a{color:#ffd978}
.ckb .ba{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
.ckb button{flex:1;min-width:90px;padding:10px 12px;border-radius:10px;border:1.5px solid #d9a21b;background:transparent;color:#fff;font-weight:600;font-size:13px;cursor:pointer}
.ckb button.p{background:#d9a21b;color:#2d0707}
.ckb label{display:flex;gap:8px;align-items:flex-start;margin-top:8px}`;

export function CookieBanner() {
  const [ck, setCk] = useState(undefined);
  const [pick, setPick] = useState(false);
  const [rem, setRem] = useState(false);
  useEffect(() => {
    setCk(readCk());
    const f = () => { setCk(null); setPick(true); };
    window.addEventListener('sm-cookie-open', f);
    return () => window.removeEventListener('sm-cookie-open', f);
  }, []);
  if (ck !== null) return null;
  const decide = (remember) => {
    const v = { v: 1, remember, t: Date.now() };
    try {
      localStorage.setItem(CK, JSON.stringify(v));
      if (!remember) localStorage.removeItem('sm_addr');
    } catch {}
    setCk(v);
  };
  return (
    <div className="ckb" role="dialog" aria-label="Cookie and storage choices">
      <style>{CSS}</style>
      <div className="in">
        <b>Your privacy, your choice.</b> We use only essential storage on your device (cart, order IDs).
        With your permission we also remember your delivery details for faster checkout.
        We use <b>no ads and no tracking</b>. <a href="/privacy">Privacy Policy</a>
        {pick ? (
          <>
            <label><input type="checkbox" checked disabled /> Essential: cart, coupon, order IDs (always on)</label>
            <label><input type="checkbox" checked={rem} onChange={(e) => setRem(e.target.checked)} /> Remember my delivery details on this device</label>
          </>
        ) : null}
        <div className="ba">
          <button onClick={() => decide(false)}>Reject</button>
          {pick ? <button className="p" onClick={() => decide(rem)}>Save choice</button> : <button onClick={() => setPick(true)}>Choose</button>}
          <button className="p" onClick={() => decide(true)}>Accept</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- policy content: { intro, chips[], sections:[[title, items[]]] } ---------- */
const who = (L) => `${L.name}, ${L.addr}`;
const contact = (L) => `Phone/WhatsApp ${L.phone}, email ${L.mail}`;

export function privacyDoc(L, extra) {
  const base = [
    ['What data we collect', [
      'Name, mobile number, delivery address and pincode that you enter at checkout.',
      'Your order details (products, packs, amount) and any review you choose to write.',
      'We do not collect card, UPI or bank details. Payment is Cash on Delivery only.',
      'We do not use ad trackers, tracking pixels, or location tracking.']],
    ['Why we use it', [
      'Only to confirm, pack, deliver and track your order, and to give replacement or refund support.',
      'We do not use your data for any other purpose without asking you first.']],
    ['How long we keep it', [
      'Order records are kept only as long as needed to complete the order, handle replacement or refund, and meet tax and legal record rules. After that they are deleted.',
      'Details saved on your own device can be removed any time from My Data.']],
    ['Who can see it', [
      'We never sell your data and never share it for advertising or marketing.',
      'Only your name, phone number and address are handed to our delivery partner so that your parcel can reach you.',
      'Our secure hosting providers store it for us under confidentiality. If a law or court order requires, we may have to disclose it to the authority.']],
    ['Your consent', [
      'We ask for your permission with an unticked box before we use your details. Nothing is pre-ticked.',
      'You can withdraw consent at any time from My Data or by writing to us.']],
    ['Your rights', [
      'Know what data we hold, get a copy, correct it, or ask us to delete it.',
      'Withdraw consent, and nominate a person to exercise your rights on your behalf.',
      'Use the My Data page, or contact us below. We act on requests within 7 days.']],
    ['Cookies and device storage', [
      'Essential storage (cart, coupon, order IDs) is needed for the shop to work.',
      'Remembering your delivery details is optional. You can Accept, Reject or Choose in the banner, and change it later from the footer.']],
    ['Children', [
      'Our shop is for adults. Anyone under 18 must order with a parent or guardian, who gives consent on their behalf.']],
    ['Data security', [
      'The website runs over HTTPS. Access to order data is limited to authorised staff.',
      'If a data breach ever affects you, we will inform you and the Data Protection Board of India as the DPDP Act 2023 requires.']],
    ['Contact person for privacy complaints', [
      `Name: ${GRIEVANCE.name}`, contact(L), `We reply ${GRIEVANCE.reply}.`, `Address: ${who(L)}`]],
  ];
  return {
    intro: 'This notice explains in simple words what personal data we take, why, how long we keep it and who sees it, as per the Digital Personal Data Protection Act, 2023.',
    chips: ['Data never sold', 'No ad tracking', 'Delete on request', 'Secure HTTPS'],
    sections: [...base, ...(extra || [])],
  };
}

export function termsDoc(L) {
  return {
    intro: `These terms apply when you order from ${L.name}. By placing an order you agree to them.`,
    chips: ['Cash on Delivery', 'Delivery partner shipping', 'Replacement or refund', 'FSSAI licensed'],
    sections: [
      ['Seller details', [`Legal name: ${L.name}`, `Address: ${L.addr}`, `GST No.: ${L.gst}`, `FSSAI Lic. No.: ${L.fssai}`, contact(L)]],
      ['Orders and prices', ['All prices are in Indian Rupees and include applicable taxes unless stated.', 'Your order is confirmed after we accept it. We may cancel an order if stock is unavailable or the address cannot be served.']],
      ['Payment', ['Cash on Delivery only. Please keep the exact amount ready.']],
      ['Eligibility', ['You must be 18 or older, or order with a parent or guardian.']],
      ['Delivery, replacement and refund', ['See the Shipping & Delivery Policy and the Replacement & Refund Policy. Both are part of these terms.']],
      ['Product information', [`Best before: ${L.best}. Store in a cool, dry place in an airtight container.`]],
      ['Governing law', ['Indian law applies. Disputes fall under the courts of Mathura, Uttar Pradesh.']],
    ],
  };
}

export function refundDoc(L) {
  return {
    intro: 'If you receive a wrong, mixed, damaged or short product, we will fix it. Your unboxing video is the proof that lets us do it fast.',
    chips: ['Unboxing video proof', 'Replacement or refund', `Report in ${REPORT_WINDOW}`, 'Free of cost'],
    sections: [
      ['When you get a replacement or refund', [
        'You received a different product, or products mixed up in the parcel or in a pack.',
        'The pack is damaged, leaking, tampered, or the quantity is short.',
        'If your video shows any of this, we send a replacement again, or refund you, whichever you prefer.']],
      ['Unboxing video is required', [
        'Record one continuous, uncut video from the sealed parcel to opening every pack.',
        'The shipping label with your name and the order ID should be clearly visible at the start.',
        'Without an unboxing video we may not be able to accept a mix-up or damage claim.']],
      ['How to claim', [
        `Within ${REPORT_WINDOW} of delivery, send the video and your Order ID on WhatsApp ${L.phone} or to ${L.mail}.`,
        'We check the video and confirm replacement or refund, normally within 2 working days.']],
      ['How refunds are paid', [
        'Since orders are Cash on Delivery, the refund goes to your bank account or UPI ID after you share the details.',
        'It is usually completed in 5 to 7 working days after approval.']],
      ['Not covered', [
        'Change of mind, or opened packs that were delivered correctly.',
        'Damage caused after delivery, or claims made after the reporting time.']],
    ],
  };
}

export function shippingDoc(L, S) {
  return {
    intro: 'We ship through trusted delivery partners. Timelines depend on the partner serving your pincode, so they can run a little earlier or later than the estimate.',
    chips: ['Delivery partner based', 'Order tracking', 'Cash on Delivery', 'Pan-India shipping'],
    sections: [
      ['Delivery time', [
        S && S.delivery_days ? `Estimated delivery: ${S.delivery_days}.` : 'The estimate is shown at checkout.',
        'This is an estimate. The exact time depends on our delivery partner, your location and the day of dispatch.',
        'Weather, strikes, festivals and remote pincodes can add delay. We will help you follow up with the partner.']],
      ['Delivery charges', ['Any delivery charge, or free delivery, is shown on the Bill & Payment page before you place the order.']],
      ['Tracking', ['Use the Track Order page with your Order ID. The delivery partner may also send you updates by SMS or call.']],
      ['Your part', ['Give a correct address, pincode and a working mobile number.', 'Keep the exact cash ready and film the unboxing as explained in our Replacement & Refund Policy.']],
      ['Delivery not possible', ['If the parcel cannot be delivered after attempts by the partner, it returns to us and we will contact you to re-send.']],
      ['Help', [contact(L)]],
    ],
  };
}
