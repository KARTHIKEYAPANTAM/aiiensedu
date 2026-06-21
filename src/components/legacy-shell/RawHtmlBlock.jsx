import React from 'react';

export default function RawHtmlBlock({ html }) {
  return (
    <div
      style={{ display: 'contents' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
