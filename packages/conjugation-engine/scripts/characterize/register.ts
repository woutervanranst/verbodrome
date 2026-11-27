import { registerHooks } from 'node:module';

// The engine sources import each other with `.js` specifiers (NodeNext style); Node does not map those to the `.ts` files.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (!specifier.startsWith('.') || !specifier.endsWith('.js')) throw error;
      return nextResolve(`${specifier.slice(0, -3)}.ts`, context);
    }
  },
});
