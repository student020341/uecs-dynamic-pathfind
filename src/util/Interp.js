// ref: https://www.trysmudford.com/blog/linear-interpolation-functions/

/**
 * get value between a and b at % t
 * 
 * @param {number} a 
 * @param {number} b 
 * @param {number} t 
 * @returns {number}
 */
export const lerp = (a, b, t) => a * (1 - t) + (b * t);

// 
export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

// get % for value between a and b
export const invlerp = (a, b, v) => clamp((v - a) / (b - a));

// transform value between data ranges
export const range = (x1, y1, x2, y2, value) => lerp(x2, y2, invlerp(x1, y1, value));
