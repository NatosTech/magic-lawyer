"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

interface CardBrand {
  name: string;
  pattern: RegExp;
  icon: string;
  color: string;
}

const CARD_BRANDS: CardBrand[] = [
  {
    name: "Visa",
    pattern: /^4/,
    icon: "💳",
    color: "#1A1F71",
  },
  {
    name: "Mastercard",
    pattern: /^5[1-5]/,
    icon: "💳",
    color: "#EB001B",
  },
  {
    name: "American Express",
    pattern: /^3[47]/,
    icon: "💳",
    color: "#006FCF",
  },
  {
    name: "Discover",
    pattern: /^6(?:011|5)/,
    icon: "💳",
    color: "#FF6000",
  },
  {
    name: "Elo",
    pattern:
      /^((((636368)|(438935)|(504175)|(451416)|(636297))[0-9]{0,10})|((5067)|(4576)|(4011))[0-9]{0,12})/,
    icon: "💳",
    color: "#00A651",
  },
  {
    name: "Hipercard",
    pattern:
      /^(384100|384140|384160|606282|637095|637568|637599|637609|637612)/,
    icon: "💳",
    color: "#FF6B35",
  },
];

export function detectCardBrand(cardNumber: string): CardBrand | null {
  const cleanNumber = cardNumber.replace(/\s/g, "");

  for (const brand of CARD_BRANDS) {
    if (brand.pattern.test(cleanNumber)) {
      return brand;
    }
  }

  return null;
}

interface CardBrandDetectorProps {
  cardNumber: string;
  cardName: string;
  expiryMonth: string;
  expiryYear: string;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

export default function CardBrandDetector({
  cardNumber,
  cardName,
  expiryMonth,
  expiryYear,
  isVisible = true,
  onToggleVisibility,
}: CardBrandDetectorProps) {
  const brand = detectCardBrand(cardNumber);
  const cleanNumber = cardNumber.replace(/\s/g, "");

  // Mascarar número do cartão (só se não estiver visível)
  const maskedNumber = isVisible
    ? cleanNumber.replace(/(.{4})/g, "$1 ").trim()
    : cleanNumber
        .replace(/\d(?=\d{4})/g, "*")
        .replace(/(.{4})/g, "$1 ")
        .trim();

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full"
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Card Preview */}
      <motion.div
        className="relative bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 h-48 overflow-hidden"
        style={{
          background: brand
            ? `linear-gradient(135deg, ${brand.color}20, ${brand.color}40)`
            : "linear-gradient(135deg, #64748b20, #64748b40)",
        }}
        transition={{ duration: 0.2 }}
        whileHover={{ scale: 1.02 }}
      >
        {/* Chip */}
        <motion.div
          animate={{ scale: 1 }}
          className="absolute top-8 left-8 w-10 h-8 bg-yellow-400 rounded-sm"
          initial={{ scale: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-sm flex items-center justify-center">
            <div className="w-3 h-2 bg-yellow-600 rounded-sm" />
          </div>
        </motion.div>

        {/* Brand Logo */}
        <AnimatePresence mode="wait">
          {brand && (
            <motion.div
              key={brand.name}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              className="absolute top-8 right-8"
              exit={{ opacity: 0, scale: 0, rotate: 180 }}
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              transition={{
                duration: 0.5,
                type: "spring",
                stiffness: 200,
                damping: 15,
              }}
            >
              <div
                className="w-14 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg"
                style={{ backgroundColor: brand.color }}
              >
                {brand.name === "Visa" && "VISA"}
                {brand.name === "Mastercard" && "MC"}
                {brand.name === "American Express" && "AMEX"}
                {brand.name === "Discover" && "DISC"}
                {brand.name === "Elo" && "ELO"}
                {brand.name === "Hipercard" && "HIPER"}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card Number */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-16 left-8 right-8"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-white font-mono text-lg tracking-wider">
              {cleanNumber ? maskedNumber : "•••• •••• •••• ••••"}
            </span>
            {onToggleVisibility && (
              <motion.button
                className="text-white/70 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggleVisibility}
              >
                {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Card Holder Name */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-10 left-8"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <span className="text-white text-sm font-medium uppercase tracking-wider">
            {cardName || "NOME DO TITULAR"}
          </span>
        </motion.div>

        {/* Expiry Date */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-10 right-8"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          <div className="text-right">
            <span className="text-white text-xs opacity-70">VALIDADE</span>
            <div className="text-white text-sm font-mono tracking-wider">
              {expiryMonth && expiryYear
                ? `${expiryMonth}/${expiryYear}`
                : "MM/AA"}
            </div>
          </div>
        </motion.div>

        {/* Brand Name */}
        <AnimatePresence>
          {brand && (
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="absolute bottom-3 right-8"
              exit={{ opacity: 0, x: 20 }}
              initial={{ opacity: 0, x: 20 }}
              transition={{ delay: 0.7, duration: 0.3 }}
            >
              <span
                className="text-xs font-medium"
                style={{ color: brand.color }}
              >
                {brand.name}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decorative Elements */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
          }}
          className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-10"
          style={{ backgroundColor: brand?.color || "#64748b" }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, -5, 0],
          }}
          className="absolute -bottom-2 -left-2 w-16 h-16 rounded-full opacity-5"
          style={{ backgroundColor: brand?.color || "#64748b" }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </motion.div>

      {/* Brand Indicator */}
      <AnimatePresence>
        {brand && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-2"
            exit={{ opacity: 0, y: -10 }}
            initial={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.8, duration: 0.3 }}
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
              }}
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: brand.color }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <span className="text-sm font-medium text-default-600">
              {brand.name} detectado
            </span>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              ✅
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
