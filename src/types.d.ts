declare module 'html2pdf.js' {
  const html2pdf: () => {
    set: (opt: Record<string, unknown>) => {
      from: (el: HTMLElement | string) => {
        save: () => Promise<void>;
      };
    };
  };
  export default html2pdf;
}
