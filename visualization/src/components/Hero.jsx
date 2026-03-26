import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ChevronRight } from 'lucide-react';

const Hero = ({ onStart }) => {
  const features = [
    "Adaptive Bcrypt Encryption",
    "Risk-Based MFA Triggering",
    "Tamper-Proof Audit Trails",
    "Sub-200ms Authentication Power"
  ];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-12">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center mb-8 glass border-white/50"
      >
        <Shield className="w-12 h-12 text-accent" />
      </motion.div>

      <div className="space-y-4">
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-6xl md:text-8xl font-serif text-primary tracking-tight"
        >
          Project <span className="text-accent italic">A.E.G.I.S.</span>
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-secondary max-w-2xl mx-auto leading-relaxed"
        >
          Visualizing the intricate layers of the Password Encryption & Authentication System. 
          A journey through high-fidelity security protocols.
        </motion.p>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap justify-center gap-4 py-8"
      >
        {features.map((feature, i) => (
          <motion.span
            key={i}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6 + i * 0.1 }}
            className="px-4 py-2 bg-white rounded-full text-sm font-medium text-secondary shadow-sm border border-gray-100 flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            {feature}
          </motion.span>
        ))}
      </motion.div>

      <motion.button
        onClick={onStart}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="group relative px-10 py-5 bg-primary text-white rounded-full font-semibold text-lg overflow-hidden shadow-2xl hover:shadow-accent/20 transition-all"
      >
        <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        <span className="relative z-10 flex items-center gap-3">
          Explore the Secure Flow
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </span>
      </motion.button>
    </div>
  );
};

export default Hero;
