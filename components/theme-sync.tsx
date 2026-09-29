'use client';
import { useEffect } from 'react';
export default function ThemeSync(){useEffect(()=>{try{const theme=localStorage.getItem('cs66-theme');document.documentElement.dataset.theme=theme==='light'?'light':'dark';}catch{}},[]);return null;}
