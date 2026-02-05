import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';

import { FAQ_HEADING, FAQ_HIGHLIGHTS, FAQ_ITEMS, type FAQItem } from '@/constants/faq';

import Highlight from './Highlight';

interface FAQAccordionItemProps {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQAccordionItem({ item, isOpen, onToggle }: FAQAccordionItemProps) {
  return (
    <div className="border-b border-zinc-200 last:border-b-0 w-full min-w-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-6 text-left hover:opacity-80 transition-opacity min-w-0"
      >
        <h3 className="text-lg font-medium text-zinc-900 flex-1 min-w-0 wrap-break-word overflow-hidden">
          {item.question}
        </h3>
        <div className="shrink-0 flex-none">
          {isOpen ? (
            <Minus className="w-5 h-5 text-zinc-600" />
          ) : (
            <Plus className="w-5 h-5 text-zinc-600" />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="pb-6 w-full min-w-0 overflow-hidden pr-8">
          <p className="text-base text-zinc-600 leading-relaxed wrap-break-word overflow-wrap-anywhere">
            {item.answer}
          </p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const words = FAQ_HEADING.title.split(' ');
  const highlightMap = new Map(FAQ_HIGHLIGHTS.map((h) => [h.wordIndex, h.color]));

  return (
    <section className="py-16 md:py-24 px-6 md:px-12 w-full overflow-x-hidden" id="faq">
      <div className="max-w-4xl mx-auto w-full">
        <div className="text-center mb-16 w-full">
          <div className="flex flex-col gap-8">
            <p className="text-center text-base text-muted-foreground md:text-lg">
              {FAQ_HEADING.label}
            </p>
            <h2 className="font-dm-sans font-medium text-4xl text-foreground tracking-tighter md:text-5xl lg:text-6xl leading-tight">
              {words.map((word, index) => {
                const color = highlightMap.get(index);
                return (
                  <span key={index}>
                    {color ? <Highlight color={color}>{word}</Highlight> : word}{' '}
                  </span>
                );
              })}
            </h2>
            <p className="md:text-lg max-w-2xl mx-auto">{FAQ_HEADING.subtitle}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6 md:p-8 w-full min-w-0">
          {FAQ_ITEMS.map((item, index) => (
            <FAQAccordionItem
              key={index}
              item={item}
              isOpen={openIndex === index}
              onToggle={() => toggleItem(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
