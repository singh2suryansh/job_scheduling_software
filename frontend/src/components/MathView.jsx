import React, { useMemo } from 'react';
import katex from 'katex';

/**
 * Render inline LaTeX equation: $equation$
 */
export function InlineMath({ math, className = '' }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math || '', {
        displayMode: false,
        throwOnError: false,
      });
    } catch (err) {
      console.warn('KaTeX inline render error:', err);
      return math || '';
    }
  }, [math]);

  return (
    <span
      className={`inline-math font-normal ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Render display / centered block LaTeX equation: $$equation$$
 */
export function BlockMath({ math, className = '' }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math || '', {
        displayMode: true,
        throwOnError: false,
      });
    } catch (err) {
      console.warn('KaTeX block render error:', err);
      return math || '';
    }
  }, [math]);

  return (
    <div
      className={`block-math my-3 overflow-x-auto text-center ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Parses mixed text containing $inline$ and $$block$$ math delimiters,
 * rendering mathematics with KaTeX and regular prose seamlessly.
 */
export function MathText({ children, className = '' }) {
  if (typeof children !== 'string') {
    return <span className={className}>{children}</span>;
  }

  const parts = useMemo(() => {
    // Regex splits on $$...$$ (block) or $...$ (inline)
    // Matches: ($$[^$]+$$) OR (\$[^\$]+\$)
    const regex = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;
    const tokens = children.split(regex);

    return tokens.map((token, index) => {
      if (token.startsWith('$$') && token.endsWith('$$')) {
        const math = token.slice(2, -2).trim();
        return <BlockMath key={index} math={math} />;
      }
      if (token.startsWith('$') && token.endsWith('$')) {
        const math = token.slice(1, -1).trim();
        return <InlineMath key={index} math={math} />;
      }
      return token;
    });
  }, [children]);

  return <span className={className}>{parts}</span>;
}

export default MathText;
