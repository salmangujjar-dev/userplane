export interface FAQLink {
  text: string;
  href: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  link?: FAQLink;
}
