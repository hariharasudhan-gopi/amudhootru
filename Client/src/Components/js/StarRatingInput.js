import { useState } from 'react';
import '../css/StarRatingInput.css';

export default function StarRatingInput(props) {
  const [hoverValue, setHoverValue] = useState(0);
  const value = hoverValue || props.value || 0;
  const stars = [1, 2, 3, 4, 5];

  return (
    <span className={`starRatingInput${props.readOnly ? ' starRatingInput_readOnly' : ''}`}>
      {stars.map((star) => (
        <i
          key={star}
          className={`fa-solid fa-star starRatingInput_star${star <= value ? ' starRatingInput_star_filled' : ''}`}
          onClick={props.readOnly ? undefined : () => props.onChange(star)}
          onMouseEnter={props.readOnly ? undefined : () => setHoverValue(star)}
          onMouseLeave={props.readOnly ? undefined : () => setHoverValue(0)}
        ></i>
      ))}
    </span>
  );
}
