import { elasticIn, elasticOut } from 'svelte/easing';

export function grow(node, { duration= 500 }) {
  return {
    duration,
    css: t => {
      const eased = elasticOut(t);

      return `
        transform: scale(${eased});
      `
    }
  };
}
export function shrink(node, { duration= 500 }) {
  return {
    duration,
    css: t => {
      const eased = elasticIn(t);

      return `
        transform: scale(${eased});
      `
    }
  };
}