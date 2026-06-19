"use client";

import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

const spring = { type: "spring", stiffness: 400, damping: 24 } as const;

/* ---------------------------------- Button --------------------------------- */

type ButtonVariant = "primary" | "accent" | "ghost";

type ButtonProps = {
  variant?: ButtonVariant;
} & Omit<HTMLMotionProps<"button">, "ref">;

const buttonBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--space-2)",
  border: "none",
  borderRadius: "var(--radius-pill)",
  fontWeight: 700,
  fontSize: "var(--text-base)",
  lineHeight: 1,
  minHeight: 48,
  padding: "0 var(--space-5)",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const buttonVariants: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "var(--coral)",
    color: "var(--accent-contrast)",
    boxShadow: "var(--shadow-coral)",
  },
  accent: {
    background: "var(--sunny)",
    color: "var(--ink)",
    boxShadow: "0 10px 24px rgba(255, 201, 77, 0.4)",
  },
  ghost: {
    background: "transparent",
    color: "var(--ink)",
    boxShadow: "inset 0 0 0 2px var(--border-strong)",
  },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = "primary", style, children, ...props }, ref) {
    const reduce = useReducedMotion();
    return (
      <motion.button
        ref={ref}
        style={{ ...buttonBase, ...buttonVariants[variant], ...style }}
        whileHover={reduce ? undefined : { scale: 1.04, y: -2 }}
        whileTap={reduce ? undefined : { scale: 0.96 }}
        transition={spring}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);

/* ----------------------------------- Card ---------------------------------- */

type CardProps = {
  interactive?: boolean;
} & Omit<HTMLMotionProps<"div">, "ref">;

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { interactive = false, style, children, ...props },
  ref,
) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-5)",
        boxShadow: "var(--shadow-sm)",
        ...style,
      }}
      whileHover={
        interactive && !reduce
          ? { y: -6, boxShadow: "var(--shadow-lg)" }
          : undefined
      }
      transition={spring}
      {...props}
    >
      {children}
    </motion.div>
  );
});

/* ----------------------------------- Pill ---------------------------------- */

type PillTone = "neutral" | "coral" | "sunny" | "success";

type PillProps = {
  tone?: PillTone;
  children: ReactNode;
} & ComponentPropsWithoutRef<"span">;

const pillTones: Record<PillTone, React.CSSProperties> = {
  neutral: { background: "var(--cream-deep)", color: "var(--ink-soft)" },
  coral: { background: "var(--coral-tint)", color: "#b8442a" },
  sunny: { background: "var(--sunny-soft)", color: "#8a5a00" },
  success: { background: "#d8f0e2", color: "#2f7a4f" },
};

export function Pill({ tone = "neutral", style, children, ...props }: PillProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "0.35rem 0.85rem",
        borderRadius: "var(--radius-pill)",
        fontSize: "var(--text-sm)",
        fontWeight: 700,
        letterSpacing: "0.01em",
        ...pillTones[tone],
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}

/* ---------------------------------- Avatar --------------------------------- */

const avatarBgs = ["#ffd9cc", "#ffe6a8", "#d7eed8", "#dbe6ff", "#f3dcff"];

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === "") return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hashIndex(name: string, len: number): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h) % len;
}

type AvatarProps = {
  name: string;
  size?: number;
} & ComponentPropsWithoutRef<"div">;

export function Avatar({ name, size = 44, style, ...props }: AvatarProps) {
  const bg = avatarBgs[hashIndex(name, avatarBgs.length)];
  return (
    <div
      aria-label={name}
      role="img"
      style={{
        width: size,
        height: size,
        borderRadius: "var(--radius-pill)",
        background: bg,
        color: "var(--ink)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: size * 0.38,
        flexShrink: 0,
        boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.6)",
        ...style,
      }}
      {...props}
    >
      {initialsFrom(name)}
    </div>
  );
}

/* ---------------------------------- Field ---------------------------------- */

type FieldProps = {
  label: string;
  hint?: string;
  multiline?: boolean;
} & ComponentPropsWithoutRef<"input"> &
  Pick<ComponentPropsWithoutRef<"textarea">, "rows">;

const controlStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--white)",
  border: "1.5px solid var(--border-strong)",
  borderRadius: "var(--radius-md)",
  padding: "var(--space-3) var(--space-4)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-base)",
  color: "var(--ink)",
  lineHeight: 1.5,
};

export function Field({
  label,
  hint,
  multiline = false,
  id,
  rows,
  style,
  ...props
}: FieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <label
      htmlFor={fieldId}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
      }}
    >
      <span style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--ink)" }}>
        {label}
      </span>
      {multiline ? (
        <textarea
          id={fieldId}
          rows={rows ?? 4}
          style={{ ...controlStyle, resize: "vertical", ...style }}
          {...(props as ComponentPropsWithoutRef<"textarea">)}
        />
      ) : (
        <input id={fieldId} style={{ ...controlStyle, ...style }} {...props} />
      )}
      {hint && (
        <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-faint)" }}>
          {hint}
        </span>
      )}
    </label>
  );
}
