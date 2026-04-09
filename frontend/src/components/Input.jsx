import { useState } from "react";
import { inputStyle } from "./inputStyle";

export default function Input({ style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      onFocus={(e) => { setFocused(true);  props.onFocus?.(e); }}
      onBlur={(e)  => { setFocused(false); props.onBlur?.(e);  }}
      style={{ ...inputStyle(focused), ...style }}
    />
  );
}
