export const decimalTransformer = {
  to: (value?: number) => value,
  from: (value?: string) => (value === null || value === undefined ? value : Number(value)),
};
