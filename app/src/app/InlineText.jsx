import {inlineParts} from '../lib/inline-format.cjs';

export default function InlineText({text}) {
  return inlineParts(text).map((part, index) => part.kind === 'strong'
    ? <strong key={index}>{part.text}</strong>
    : part.kind === 'em' ? <em key={index}>{part.text}</em> : part.text);
}
