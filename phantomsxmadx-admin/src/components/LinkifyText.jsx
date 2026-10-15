import React from 'react';

const LinkifyText = ({ text }) => {
  if (!text) return null;

  // Regex to detect URLs starting with http or https
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <>
      {parts.map((part, i) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline break-all transition-all"
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </>
  );
};

export default LinkifyText;
