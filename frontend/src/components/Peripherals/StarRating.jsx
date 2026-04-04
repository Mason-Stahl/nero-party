//StarRating.js
import React, { useState, useRef } from "react";
import "./StarRating.css";

const TOTAL_STARS = 5;


export default function StarRating({ rating, onRatingChange, readOnly = false }) {
  const numericRating = Number(rating) || 0;
  const [hoverRating, setHoverRating] = useState(numericRating); 
  const containerRef = useRef(null);

  const effectiveRating = readOnly ? numericRating : hoverRating;

  // Convert a mouse x-position to a 0-5 rating with half increments
  const getHoverValue = (x) => {
    if (!containerRef.current) return rating;
    const { left, width } = containerRef.current.getBoundingClientRect();
    const relativeX = x - left; // distance from left edge of container
    const percent = relativeX / width; // 0 to 1
    let rawStars = percent * TOTAL_STARS; // 0 to 5
    // Round to nearest 0.5
    rawStars = Math.round(rawStars * 2) / 2; 
    // Clamp
    if (rawStars < 0) rawStars = 0;
    if (rawStars > TOTAL_STARS) rawStars = TOTAL_STARS;
    return rawStars;
  };

  const handleMouseMove = (e) => {
    const newHover = getHoverValue(e.clientX);
    setHoverRating(newHover);
  };

  const handleMouseLeave = () => {
    setHoverRating(rating);
  };

  const handleClick = (e) => {
    const clickedRating = getHoverValue(e.clientX);
    onRatingChange(clickedRating);
    setHoverRating(clickedRating);
  };

  // For each star index from 1 to 5, figure out how "filled" it should be
  // based on hoverRating
  const starsArray = Array.from({ length: TOTAL_STARS }, (_, i) => {
    const starNumber = i + 1;
    let fillPercentage = 0;
    const diff = effectiveRating - (starNumber - 1);
    if (diff >= 1) {
      fillPercentage = 100;
    } else if (diff > 0) {
      fillPercentage = 50;
    }

    return (
      <div key={i} className="star-container">
        <div className="star-background">&#9733;</div>
        <div
          className="star-foreground"
          style={{ width: `${fillPercentage}%` }}
        >
          &#9733;
        </div>
      </div>
    );
  });
  

  return (
    <div
      className="star-rating-container"
      ref={containerRef}
      onMouseMove={readOnly ? undefined : handleMouseMove}
      onMouseLeave={readOnly ? undefined : handleMouseLeave}
      onClick={readOnly ? undefined : handleClick}
    >
      {starsArray}
    </div>
  );
}
