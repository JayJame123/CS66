'use client';
import { motion, useReducedMotion } from 'framer-motion';
export default function Template({children}:{children:React.ReactNode}){const reduce=useReducedMotion();return <motion.div initial={reduce?false:{opacity:0}} animate={{opacity:1}} transition={{duration:.25}}>{children}</motion.div>;}
