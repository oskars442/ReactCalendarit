"use client";
export default function GlobalError({error}:{error:Error}) { return <div style={{padding:24}}><h2>Something went wrong</h2><pre>{error.message}</pre></div>; }
