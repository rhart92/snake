import React, { useState, useEffect, useRef } from "react";

export function useInterval(callback: () => void, delay?: number) {
  const fn = useRef(callback);

  // Still not sure why we need a `useEffect`, but technically feels
  // side-effecty so maybe this makes sense, but this should update the ref on
  // any changes.
  useEffect(() => {
    fn.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      fn.current();
    }

		// Only setup a timer if we have a delay
    if (typeof delay !== 'undefined') {
      const id = setInterval(() => {
        tick();
      }, delay);

      // Clean up
			// Conditional clean up?
      return () => clearInterval(id);
    }
  }, [delay]);
}
