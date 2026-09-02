/**
 * WHERE TO REACH ALEX. One place, four channels. The labels are in
 * `i18n/strings.ts` (they are words); these are the addresses (they are not).
 */
export type Channel = {
  key: 'x' | 'linkedin' | 'email' | 'phone';
  /** What the row shows. */
  value: string;
  href: string;
  external?: boolean;
};

export const contact: Channel[] = [
  { key: 'x',        value: '@AlexSamnoy',                 href: 'https://x.com/AlexSamnoy', external: true },
  { key: 'linkedin', value: 'in/alexander-samnøy',         href: 'https://www.linkedin.com/in/alexander-samn%C3%B8y-25a3071b/', external: true },
  { key: 'email',    value: 'alexander.samnoy@gmail.com',  href: 'mailto:alexander.samnoy@gmail.com' },
  { key: 'phone',    value: '+47 990 02 521',              href: 'tel:+4799002521' },
];
