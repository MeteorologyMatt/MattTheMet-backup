import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  EnvelopeIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  XMarkIcon,
  Bars3Icon,
  ArrowDownTrayIcon,
  LinkIcon,
  ArrowUpIcon,
  MapPinIcon,
  CalendarIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Routes, Route, NavLink, Link, useLocation } from "react-router-dom";

/* -------------------------------------------------------------------------- */
/* Utilities                                                                   */
/* -------------------------------------------------------------------------- */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safeJson(obj) {
  try {
    return JSON.stringify(obj);
  } catch {
    return "";
  }
}

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* -------------------------------------------------------------------------- */
/* Hooks                                                                       */
/* -------------------------------------------------------------------------- */

function useOnEscape(onEscape, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e) {
      if (e.key === "Escape") onEscape?.(e);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onEscape, enabled]);
}

function useLockBodyScroll(locked) {
  useEffect(() => {
    if (!locked) return;

    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [locked]);
}

function useFocusTrap(isOpen, containerRef, { initialFocusSelector } = {}) {
  useEffect(() => {
    if (!isOpen) return;
    const container = containerRef?.current;
    if (!container) return;

    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");

    const getFocusable = () =>
      Array.from(container.querySelectorAll(focusableSelector)).filter(
        (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden")
      );

    const prevActive = document.activeElement;

    const initial =
      (initialFocusSelector ? container.querySelector(initialFocusSelector) : null) ||
      getFocusable()[0];

    if (initial && typeof initial.focus === "function") initial.focus();

    function onKeyDown(e) {
      if (e.key !== "Tab") return;

      const focusables = getFocusable();
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      const isShift = e.shiftKey;
      const active = document.activeElement;

      if (!isShift && active === last) {
        e.preventDefault();
        first.focus();
      } else if (isShift && active === first) {
        e.preventDefault();
        last.focus();
      }
    }

    container.addEventListener("keydown", onKeyDown);

    return () => {
      container.removeEventListener("keydown", onKeyDown);
      if (prevActive && typeof prevActive.focus === "function") prevActive.focus();
    };
  }, [isOpen, containerRef, initialFocusSelector]);
}

/* -------------------------------------------------------------------------- */
/* Motion presets                                                              */
/* -------------------------------------------------------------------------- */

function useMotionPresets() {
  const reduce = useReducedMotion();

  const page = useMemo(
    () => ({
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: reduce ? 0 : 0.35 },
    }),
    [reduce]
  );

  const fadeInUp = useMemo(
    () => ({
      initial: { opacity: 0, y: 18 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, margin: "-80px" },
      transition: { duration: reduce ? 0 : 0.5, ease: "easeOut" },
    }),
    [reduce]
  );

  const stagger = useMemo(
    () => ({
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: reduce ? 0 : 0.07,
          delayChildren: reduce ? 0 : 0.06,
        },
      },
    }),
    [reduce]
  );

  const item = useMemo(
    () => ({
      hidden: { opacity: 0, y: 14 },
      show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.35 } },
    }),
    [reduce]
  );

  return { reduce, page, fadeInUp, stagger, item };
}

/* -------------------------------------------------------------------------- */
/* Small components                                                            */
/* -------------------------------------------------------------------------- */

function SkipToContentButton() {
  return (
    <button
      type="button"
      onClick={() => {
        const main = document.getElementById("main");
        if (main) {
          main.scrollIntoView({ behavior: "smooth" });
          // try to focus for keyboard users
          main.setAttribute("tabindex", "-1");
          main.focus({ preventScroll: true });
        }
      }}
      className={cx(
        "sr-only focus:not-sr-only",
        "fixed left-4 top-4 z-[100] rounded-md",
        "bg-white text-slate-900 shadow ring-1 ring-black/10",
        "px-4 py-2 font-semibold"
      )}
    >
      Skip to content
    </button>
  );
}

function Container({ className, children }) {
  return <div className={cx("mx-auto w-full max-w-6xl", className)}>{children}</div>;
}

function SectionHeading({ icon: Icon, title, subtitle, align = "left" }) {
  return (
    <div className={cx("mb-6", align === "center" && "text-center")}>
      <div
        className={cx(
          "inline-flex items-center gap-2",
          align === "center" && "justify-center w-full"
        )}
      >
        {Icon ? <Icon className="h-5 w-5 text-sky-600" /> : null}
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50">
          {title}
        </h2>
      </div>
      {subtitle ? (
        <p
          className={cx(
            "mt-2 text-slate-600 dark:text-slate-300",
            align === "center" && "mx-auto max-w-2xl"
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function Badge({ children, tone = "sky" }) {
  const tones = {
    sky: "bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-900/60",
    emerald:
      "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/60",
    slate:
      "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-200 dark:ring-slate-700/60",
  };

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1",
        tones[tone] ?? tones.slate
      )}
    >
      {children}
    </span>
  );
}

function IconButton({ label, onClick, children, className, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cx(
        "inline-flex items-center justify-center rounded-md p-2 cursor-pointer",
        "ring-1 ring-black/10 bg-gray-100/70 hover:bg-gray-100",
        "dark:bg-slate-900/50 dark:hover:bg-slate-900 dark:ring-white/10",
        "transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function PrimaryButton({ onClick, children, className, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex items-center justify-center gap-2",
        "px-5 py-3 rounded-md font-semibold text-white shadow-lg",
        "bg-gradient-to-r from-sky-600 to-emerald-500",
        "hover:brightness-110 hover:-translate-y-[1px] transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function PrimaryLink({ to, children, className, ...props }) {
  return (
    <Link
      to={to}
      className={cx(
        "inline-flex items-center justify-center gap-2",
        "px-5 py-3 rounded-md font-semibold text-white shadow-lg",
        "bg-gradient-to-r from-sky-600 to-emerald-500",
        "hover:brightness-110 hover:-translate-y-[1px] transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

function OutlineButton({ onClick, children, className, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex items-center justify-center gap-2",
        "px-5 py-3 rounded-md font-semibold",
        "border-2 border-sky-600 text-sky-700",
        "hover:bg-sky-600 hover:text-white transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function OutlineLink({ to, children, className, ...props }) {
  return (
    <Link
      to={to}
      className={cx(
        "inline-flex items-center justify-center gap-2",
        "px-5 py-3 rounded-md font-semibold",
        "border-2 border-sky-600 text-sky-700",
        "hover:bg-sky-600 hover:text-white transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

function ExternalLink({ href, children, className }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(
        "inline-flex items-center gap-2",
        "text-sky-700 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200",
        "underline underline-offset-4 decoration-sky-300/70 hover:decoration-sky-500 transition",
        className
      )}
    >
      <LinkIcon className="h-4 w-4" />
      {children}
    </a>
  );
}

function InfoCard({ title, children }) {
  return (
    <div
      className={cx(
        "rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5",
        "hover:shadow-md transition",
        "dark:bg-slate-950 dark:ring-white/10"
      )}
    >
      <h4 className="font-semibold text-sky-700 dark:text-sky-300">{title}</h4>
      <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{children}</div>
    </div>
  );
}

function Callout({ icon: Icon, title, children, tone = "sky" }) {
  const tones = {
    sky: "bg-sky-50 ring-sky-100 dark:bg-sky-950/40 dark:ring-sky-900/60",
    emerald: "bg-emerald-50 ring-emerald-100 dark:bg-emerald-950/40 dark:ring-emerald-900/60",
    slate: "bg-slate-50 ring-slate-100 dark:bg-slate-900/40 dark:ring-white/10",
  };

  const iconTones = {
    sky: "text-sky-700 dark:text-sky-200",
    emerald: "text-emerald-700 dark:text-emerald-200",
    slate: "text-slate-700 dark:text-slate-200",
  };

  return (
    <div className={cx("rounded-xl p-5 ring-1", tones[tone] ?? tones.slate)}>
      <div className="flex items-start gap-3">
        {Icon ? <Icon className={cx("h-6 w-6 mt-0.5", iconTones[tone] ?? iconTones.slate)} /> : null}
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-50">{title}</p>
          <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal (Experience details)                                                  */
/* -------------------------------------------------------------------------- */

function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  labelledById = "modal-title",
  describedById = "modal-desc",
}) {
  const panelRef = useRef(null);

  useLockBodyScroll(open);
  useOnEscape(onClose, open);
  useFocusTrap(open, panelRef, { initialFocusSelector: "[data-autofocus]" });

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
          aria-labelledby={labelledById}
          aria-describedby={describedById}
        >
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            ref={panelRef}
            initial={{ y: 22, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 22, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className={cx(
              "relative w-full max-w-2xl",
              "rounded-2xl bg-white shadow-2xl ring-1 ring-black/10",
              "dark:bg-slate-950 dark:ring-white/10"
            )}
          >
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3
                    id={labelledById}
                    className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50"
                  >
                    {title}
                  </h3>
                  {subtitle ? (
                    <p
                      id={describedById}
                      className="mt-2 text-sm text-slate-600 dark:text-slate-300"
                    >
                      {subtitle}
                    </p>
                  ) : null}
                </div>

                <IconButton label="Close" onClick={onClose} data-autofocus>
                  <XMarkIcon className="h-6 w-6 text-slate-800 dark:text-slate-100" />
                </IconButton>
              </div>

              <div className="mt-6">{children}</div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-md border-2 border-sky-600 text-sky-700 hover:bg-sky-600 hover:text-white transition"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/* Mobile Drawer (Router nav)                                                  */
/* -------------------------------------------------------------------------- */

function MobileDrawer({ open, onClose, navItems }) {
  const panelRef = useRef(null);

  useLockBodyScroll(open);
  useOnEscape(onClose, open);
  useFocusTrap(open, panelRef, { initialFocusSelector: "[data-autofocus]" });

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
          aria-label="Mobile navigation"
        >
          <motion.button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            ref={panelRef}
            className={cx(
              "absolute right-0 top-0 h-full w-[88%] max-w-sm",
              "bg-white shadow-2xl ring-1 ring-black/10",
              "dark:bg-slate-950 dark:ring-white/10"
            )}
            initial={{ x: 28, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 28, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Menu
                </p>
                <IconButton label="Close menu" onClick={onClose} data-autofocus>
                  <XMarkIcon className="h-6 w-6 text-slate-800 dark:text-slate-100" />
                </IconButton>
              </div>

              <nav className="mt-6 flex flex-col gap-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cx(
                        "flex items-center gap-2 rounded-lg px-3 py-3 font-medium transition",
                        "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
                        "dark:text-slate-200 dark:hover:bg-slate-900/60",
                        isActive &&
                          "bg-sky-50 text-sky-800 ring-1 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-900/60"
                      )
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="mt-8 rounded-xl bg-slate-50 p-4 ring-1 ring-black/5 dark:bg-slate-900/40 dark:ring-white/10">
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  Tip: Press <span className="font-semibold">Esc</span> to close.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/* Scroll to top button                                                        */
/* -------------------------------------------------------------------------- */

function ScrollToTopButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > 700);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show ? (
        <motion.button
          type="button"
          aria-label="Scroll to top"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={cx(
            "fixed bottom-6 right-6 z-40",
            "rounded-full p-3 shadow-lg ring-1 ring-black/10",
            "bg-white/80 hover:bg-white transition backdrop-blur",
            "dark:bg-slate-950/70 dark:hover:bg-slate-950 dark:ring-white/10"
          )}
        >
          <ArrowUpIcon className="h-5 w-5 text-slate-800 dark:text-slate-100" />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/* Route scroll reset                                                          */
/* -------------------------------------------------------------------------- */

function RouteScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}

/* -------------------------------------------------------------------------- */
/* Shared data                                                                 */
/* -------------------------------------------------------------------------- */

function useProfile() {
  const BASE = import.meta.env.BASE_URL;

  return useMemo(
    () => ({
      name: "Matthew Lentz",
      initials: "ML",
      title: "Undergraduate Meteorology Student",
      location: "Starkville, MS",
      email: "mwl140@msstate.edu",
      linkedin: "https://www.linkedin.com/in/matthew-lentz-30b2922b0",
      resume: `${BASE}Lentz_Matthew_Resume_2025.pdf`,
      portrait: `${BASE}matthew.jpg`,
      heroImage: `${BASE}weather-hero.jpg`,
    }),
    [BASE]
  );
}

function useNavItems() {
  return useMemo(
    () => [
      { to: "/", label: "Home", icon: AcademicCapIcon },
      { to: "/research", label: "Research", icon: DocumentTextIcon },
      { to: "/experience", label: "Experience", icon: SparklesIcon },
      { to: "/survey", label: "Survey", icon: DocumentTextIcon },
      { to: "/contact", label: "Contact", icon: EnvelopeIcon },
    ],
    []
  );
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                      */
/* -------------------------------------------------------------------------- */

function SiteLayout({ children }) {
  const profile = useProfile();
  const navItems = useNavItems();

  const [mobileOpen, setMobileOpen] = useState(false);

  useOnEscape(() => setMobileOpen(false), mobileOpen);

  return (
    <div
      className={cx(
        "relative min-h-screen overflow-hidden",
        "bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100",
        "text-slate-900 dark:text-slate-50",
        "dark:from-slate-950 dark:via-slate-950 dark:to-slate-950"
      )}
    >
      <SkipToContentButton />

      {/* Decorative hero background image */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[-6rem] h-[28rem] opacity-30 dark:opacity-20"
        style={{
          backgroundImage: `url(${profile.heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0.25), rgba(0,0,0,0))",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0.25), rgba(0,0,0,0))",
        }}
      />

      {/* Decorative blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-gray-300 rounded-full mix-blend-multiply blur-3xl opacity-25 animate-pulse dark:opacity-10" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-gray-400 rounded-full mix-blend-multiply blur-3xl opacity-25 animate-pulse dark:opacity-10" />

      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navItems={navItems}
      />

      {/* Top bar / nav */}
      <header className="sticky top-0 z-40 backdrop-blur bg-gray-100/60 ring-1 ring-black/5 dark:bg-slate-950/60 dark:ring-white/10">
        <Container className="px-6 lg:px-12">
          <div className="flex items-center justify-between py-4">
            {/* Brand */}
            <Link to="/" className="flex items-center gap-4 group">
              <div
                className={cx(
                  "w-12 h-12 rounded-full",
                  "bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500",
                  "flex items-center justify-center text-white font-extrabold",
                  "shadow-sm ring-1 ring-black/10",
                  "group-hover:scale-105 transition"
                )}
              >
                {profile.initials}
              </div>

              <div className="leading-tight">
                <p className="text-base font-bold text-slate-900 dark:text-slate-50">
                  {profile.name}
                </p>
                <p className="text-xs text-slate-600 italic dark:text-slate-300">
                  {profile.title}
                </p>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cx(
                      "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
                      "text-slate-700 hover:text-slate-900 hover:bg-slate-50",
                      "dark:text-slate-200 dark:hover:text-slate-50 dark:hover:bg-slate-900/60",
                      isActive &&
                        "bg-sky-50 text-sky-800 ring-1 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-900/60"
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <IconButton
                label="Facebook"
                onClick={() => window.open('https://www.facebook.com/matthew.lentz.92798', '_blank')}
              >
                <img src={`${import.meta.env.BASE_URL}Facebook_Logo_2023.png`} alt="Facebook" className="h-5 w-5" />
              </IconButton>
              <IconButton
                label="Instagram"
                onClick={() => window.open('https://www.instagram.com/matt_the_met?igsh=MWZmYmRtMTF5cmJ0bw==', '_blank')}
              >
                <img src={`${import.meta.env.BASE_URL}Instagram_logo_2022.svg.png`} alt="Instagram" className="h-5 w-5" />
              </IconButton>
              <IconButton
                label="LinkedIn"
                onClick={() => window.open('https://www.linkedin.com/in/matthew-lentz-30b2922b0', '_blank')}
              >
                <img src={`${import.meta.env.BASE_URL}LinkedIn_logo_initials.png`} alt="LinkedIn" className="h-5 w-5" />
              </IconButton>

              <div className="md:hidden">
                <IconButton label="Open menu" onClick={() => setMobileOpen(true)}>
                  <Bars3Icon className="h-6 w-6 text-slate-800 dark:text-slate-100" />
                </IconButton>
              </div>
            </div>
          </div>
        </Container>
      </header>

      {/* Main content */}
      <main id="main" className="outline-none">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-black/5 dark:border-white/10">
        <Container className="px-6 lg:px-12 py-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                © {new Date().getFullYear()} {profile.name}. All rights reserved.
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <NavLink to="/" className="text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-slate-50">
                Home
              </NavLink>
              <NavLink to="/research" className="text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-slate-50">
                Research
              </NavLink>
              <NavLink to="/experience" className="text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-slate-50">
                Experience
              </NavLink>
              <NavLink to="/survey" className="text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-slate-50">
                Survey
              </NavLink>
              <NavLink to="/contact" className="text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-slate-50">
                Contact
              </NavLink>
            </div>
          </div>
        </Container>
      </footer>

      <ScrollToTopButton />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pages                                                                       */
/* -------------------------------------------------------------------------- */

function HomePage() {
  const profile = useProfile();
  const { page, fadeInUp } = useMotionPresets();

  // JSON-LD (SEO)
  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Person",
      name: profile.name,
      jobTitle: profile.title,
      email: `mailto:${profile.email}`,
      url: profile.linkedin,
      sameAs: [profile.linkedin],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Starkville",
        addressRegion: "MS",
        addressCountry: "US",
      },
    }),
    [profile]
  );

  return (
    <motion.div {...page}>
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }} />

      <Container className="px-6 lg:px-12">
        {/* HERO */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-10 items-center py-14 md:py-20">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="md:col-span-2"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="sky">Meteorology</Badge>
              <Badge tone="emerald">Wildfire Climatology</Badge>
              <Badge tone="slate">Weather Communication</Badge>
            </div>

            <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold leading-tight">
              <span className="bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-600 bg-clip-text text-transparent">
                Hello, I’m {profile.name}.
              </span>
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-slate-700 dark:text-slate-200">
              I’m a first-year master's student studying meteorology at Mississippi State University, focusing on synoptic meteorology, weather communication, and AI/ML modeling techniques. I love using research to help people prepare for
              severe weather and the ever-evolving state of the atmosphere.
            </p>

            <div className="mt-7 flex flex-wrap gap-4">
              <a
                href={profile.resume}
                download
                className={cx(
                  "inline-flex items-center justify-center gap-2",
                  "px-5 py-3 rounded-md font-semibold text-white shadow-lg",
                  "bg-gradient-to-r from-sky-600 to-emerald-500",
                  "hover:brightness-110 hover:-translate-y-[1px] transition",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                )}
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Download Résumé
              </a>

              <OutlineLink to="/research">
                <DocumentTextIcon className="h-5 w-5" />
                View Research
              </OutlineLink>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-2">
                <MapPinIcon className="h-4 w-4" />
                {profile.location}
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-400/70" />
              <a
                href={`mailto:${profile.email}`}
                className="underline underline-offset-4 decoration-slate-300 hover:decoration-slate-500"
              >
                {profile.email}
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex justify-center md:justify-end"
          >
            <div
              className={cx(
                "relative w-56 h-56 sm:w-64 sm:h-64",
                "rounded-3xl overflow-hidden shadow-xl",
                "border-4 border-transparent",
                "bg-gradient-to-tr from-sky-500 to-emerald-500 p-[2px]"
              )}
            >
              <img
                alt={`Portrait of ${profile.name}`}
                src={profile.portrait}
                className="w-full h-full object-cover rounded-3xl"
                loading="lazy"
              />
            </div>
          </motion.div>
        </section>
      </Container>

      {/* ABOUT (home-only section, no hash links) */}
      <Container className="px-6 lg:px-12">
        <motion.div {...fadeInUp}>
          <section
            id="home-about"
            className={cx(
              "mb-14 rounded-2xl p-8 shadow-sm ring-1 ring-black/5",
              "bg-white/70 backdrop-blur",
              "dark:bg-slate-950/60 dark:ring-white/10"
            )}
          >
            <SectionHeading
              icon={AcademicCapIcon}
              title="About Me"
              align="center"
            />

            <p className="mx-auto max-w-3xl text-center text-lg leading-relaxed text-slate-700 dark:text-slate-200">
              <span className="font-semibold">4.0 GPA</span> | Shackouls Honors College | Mississippi State University
              <br />
              Pursuing graduate research in synoptic meteorology and atmospheric dynamics, specifically investigating the mechanisms of jet stream superposition and its role in explosive cyclogenesis. I aim to integrate these technical insights into the Weather, Climate, and Society framework to refine risk communication strategies and improve institutional decision-making for communities during high-impact weather events.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <InfoCard title="Education">
              <div className="mb-4">•   B.S. in Geosciences (Professional Meteorology)</div>
              <div className="mb-4">•   Minors: Math & Sociology</div>
              <div>•   Mississippi State University (August 2022 - May 2026)</div>
            </InfoCard>
              <InfoCard title="Skills">
              <div className="mb-4">  •   Python</div>
              <div className="mb-4">  •   ArcGIS Pro</div>
              <div className="mb-4">  •   SPSS (statistical analysis software)</div>
              <div className="mb-4">  •   Data analysis</div>
              <div className="mb-4">  •   Predictive modeling</div>
              <div className="mb-4">  •   Research communication</div>
              <div>  •   Visualization</div>
              </InfoCard>
              <InfoCard title="Certifications">
                <div className="mb-4">  •   CITI Program Certified (Social & Behavioral Research)</div>
              <div>  •   NWS Skywarn Trained Storm Spotter</div>
              </InfoCard>
            </div>

            <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Callout title={<span className="block w-full text-center">Core Competencies</span>} tone="slate">
               I work with large meteorological datasets using R and Python and study large-scale atmospheric dynamics, especially jet stream interactions and their impacts on winter weather. I also create visualizations and GIS products that help communicate complex weather information to diverse audiences.
              </Callout>

              <Callout title={<span className="block w-full text-center">Research Focus</span>} tone="slate">
                My research portfolio centers on the intersection of synoptic-scale dynamics and societal impacts, investigating how extreme weather triggers influence public risk perception. I am dedicated to integrating the principles of weather, climate, and society into the study of high-impact events, with a specific focus on optimizing protective action and communication strategies for all people and communities.
              </Callout>

              <Callout title={<span className="block w-full text-center">Professional Interests</span>} tone="slate">
                I am pursuing graduate-level research and professional collaborations focused on integrating synoptic meteorology, climate risk, and sociology. My objective is to develop equitable decision-support frameworks and science communication tools that translate rigorous meteorological modeling into improved public safety outcomes, ensuring advanced dynamical forecasts serve all effectively.
              </Callout>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <OutlineLink to="/experience">See Experience</OutlineLink>
              <OutlineLink to="/survey">Survey Page</OutlineLink>
              <PrimaryLink to="/contact">Contact</PrimaryLink>
            </div>
          </section>
        </motion.div>
      </Container>
    </motion.div>
  );
}

function ResearchPage() {
  const { page, fadeInUp } = useMotionPresets();

  return (
    <motion.div {...page}>
      <Container className="px-6 lg:px-12 py-12">
        <motion.div {...fadeInUp}>
          <SectionHeading
            icon={DocumentTextIcon}
            title="Research"
            subtitle="Honors thesis focus and current research direction."
          />

          {/* Grid Layout: 2 Columns (50/50 split) for Research Cards Only */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* --- LEFT COLUMN: Honors Thesis --- */}
            <div className="h-full flex flex-col rounded-2xl bg-white p-7 shadow-sm ring-1 ring-black/5 dark:bg-slate-950 dark:ring-white/10">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Honors Thesis: Severe Weather Risk Perception
              </h3>

              <p className="mt-4 text-slate-700 dark:text-slate-200 leading-relaxed">
                I’m investigating how international students at Mississippi State University perceive severe weather and
                its risks. I’m focusing on how prior weather experience, language and cultural context, and warning
                comprehension shape decision-making, plus which channels (sirens, WEA, social media) students trust.
              </p>

              <p className="mt-4 text-slate-700 dark:text-slate-200 leading-relaxed">
                The goal is to surface actionable recommendations for MSU alerts, outreach, and culturally responsive
                risk communication that reduces confusion and improves action.
              </p>

              {/* Presentation Highlight: Thesis */}
              <div className="mt-6 border-l-4 border-sky-500 pl-4 py-1 bg-sky-50/50 dark:bg-sky-900/10 rounded-r-lg">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Upcoming Presentation
                </h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-sky-700 dark:text-sky-400 block mb-1">
                    2026 Southeast Severe Storms Symposium
                  </span>
                  Presenting findings on risk perception gaps and warning channel trust among diverse student populations.
                </p>
              </div>

              {/* Badges - Pushed to bottom */}
              <div className="mt-auto pt-6 flex flex-wrap gap-2">
                <Badge tone="sky">Risk Communication</Badge>
                <Badge tone="emerald">Weather & Society</Badge>
                <Badge tone="slate">Survey Research</Badge>
              </div>
            </div>

            {/* --- RIGHT COLUMN: SEMBRAR --- */}
            <div className="h-full flex flex-col rounded-2xl bg-white p-7 shadow-sm ring-1 ring-black/5 dark:bg-slate-950 dark:ring-white/10">
              <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-400">
                Current Role: SEMBRAR Mississippi & Florida
              </h3>
              
              <p className="mt-4 text-slate-700 dark:text-slate-200 leading-relaxed">
                I am a student researcher for the SEMBRAR project, a multidisciplinary initiative fostering 
                environmental literacy among multilingual learners. I analyze how synoptic-scale processes 
                translate into localized environmental risks.
              </p>
              
              <p className="mt-4 text-slate-700 dark:text-slate-200 leading-relaxed">
                By applying weather, climate, and society principles, I develop ways to communicate 
                these complex weather and environmental phenomena to diverse communities, integrating place-based education.
              </p>

              {/* Presentation Highlight: SEMBRAR */}
              <div className="mt-6 border-l-4 border-emerald-500 pl-4 py-1 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-r-lg">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Upcoming Presentation
                </h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
                    MSU Undergraduate Research Symposium (Spring 2026)
                  </span>
                  Presenting research on the intersection of atmospheric physics and community advocacy within a bilingual framework.
                </p>
              </div>
              
              {/* Badges */}
              <div className="mt-auto pt-6 flex flex-wrap gap-2">
                 <Badge tone="emerald">Bilingual Education</Badge>
                 <Badge tone="sky">Synoptic Meteorology</Badge>
                 <Badge tone="slate">Social Research</Badge>
              </div>
            </div>

          </div>

          {/* --- NEW: Centered Contact Section Below Grid --- */}
          {/* mt-24 adds space above. pb-12 ensures space before the footer starts. */}
          <div className="mt-24 pb-12 flex flex-col items-center justify-center space-y-6">
            <h2 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-50">
              Questions? Feel free to reach out!
            </h2>
            
            <p className="text-slate-600 dark:text-slate-300 text-center max-w-lg">
              I am always interested in connecting with peers and professionals working in synoptic meteorology, risk communication, or societal resilience.
            </p>

            <PrimaryLink to="/contact" className="px-8 py-3">
              Contact Me
              <EnvelopeIcon className="h-5 w-5 ml-2" />
            </PrimaryLink>
          </div>

        </motion.div>
      </Container>
    </motion.div>
  );
}

function ProjectCard({ proj, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(proj.id)}
      className={cx(
        "group text-left w-full",
        "rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5",
        "hover:shadow-lg hover:-translate-y-[1px] transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600",
        "dark:bg-slate-950 dark:ring-white/10"
      )}
      aria-haspopup="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-sky-700 group-hover:text-sky-800 dark:text-sky-300 dark:group-hover:text-sky-200">
            {proj.title}
          </h4>
          <p className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <CalendarIcon className="h-4 w-4" />
            {proj.subtitle}
          </p>
        </div>
        <span className="mt-1 inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold bg-slate-50 text-slate-700 ring-1 ring-black/5 dark:bg-slate-900/40 dark:text-slate-200 dark:ring-white/10">
          Details
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{proj.short}</p>

      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 dark:text-sky-300">
        Read more
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 11-1.414-1.414L13.586 10 10.293 6.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    </button>
  );
}

function ExperiencePage() {
  const { page, fadeInUp, stagger, item } = useMotionPresets();
  const [openProjectId, setOpenProjectId] = useState(null);

  const projects = useMemo(
    () => [
      {
        id: "usda",
        title: "USDA Agricultural Research Service: Climate & Ag",
        subtitle: "Undergraduate Researcher • Fall 2024 – Spring 2025 • Starkville, MS",
        short:
          "Modeled extreme rainfall & temperature trends (RCP 4.5 & 8.5) to assess climate impacts on agriculture.",
        details: [
          "Built Python workflows to analyze historical and projected climate (RCP 4.5/8.5) and quantify extreme rain/temperature changes relevant to crop management.",
          "Derived metrics (e.g., annual maxima, heatwave days) and visualized shifts to support sustainable agricultural practices.",
          "Collaborated with Dr. Feng; communicated findings for non-technical stakeholders.",
        ],
        tags: ["Python", "Climate Projections", "Extremes", "RCP 4.5/8.5"],
      },
      {
        id: "uca",
        title: "University of Central Arkansas: Wildfire Climatology",
        subtitle: "Undergraduate Research Assistant • Summer 2025 • Remote",
        short:
          "Spatial analysis of wildfire causes & patterns in the Ozark and Ouachita Mountains using ArcGIS Pro & Python.",
        details: [
          "Compiled wildfire occurrence data and environmental covariates to explore spatiotemporal patterns.",
          "Evaluated fire causes, climate drivers, and hot spots; produced cartographic products in ArcGIS Pro.",
          "Worked with Dr. Flatley on interpretable visuals and summaries for broader audiences.",
        ],
        tags: ["ArcGIS Pro", "Spatial Analysis", "Python", "Wildfire"],
      },
      {
        id: "nws",
        title: "National Weather Service at Little Rock, AR",
        subtitle: "Intern • Summer 2024",
        short: "Hands-on forecast operations, balloon launches, storm surveys, and public communication.",
        details: [
          "Assisted forecasters in AWIPS; practiced real-time decision support and messaging.",
          "Performed Grawmet radiosonde preparations and weather balloon launches.",
          "Participated in storm surveys; answered public/partner calls; delivered NOAA Weather Radio segments.",
        ],
        tags: ["AWIPS", "Operations", "Radiosonde", "Communication"],
      },
    ],
    []
  );

  const activeProject = useMemo(
    () => projects.find((p) => p.id === openProjectId) || null,
    [projects, openProjectId]
  );

  useOnEscape(() => setOpenProjectId(null), openProjectId !== null);

  return (
    <motion.div {...page}>
      <Container className="px-6 lg:px-12 py-12">
        <motion.div {...fadeInUp}>
          <SectionHeading
            icon={SparklesIcon}
            title="Past Research and Experiences"
            subtitle="Selected experiences across research, operations, and communication."
          />

          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {projects.map((proj) => (
                <ProjectCard key={proj.id} proj={proj} onOpen={setOpenProjectId} />
              ))}
            </motion.div>
          </motion.div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Section 1: How I work */}
  <Callout title={<span className="block w-full text-center">Methodological Approach</span>} tone="slate">
    I structure my work around reproducible research frameworks and rigorous documentation to ensure data integrity. My output strategy is communication-centric, transforming technical analysis into high-impact dashboards, cartographic products, and stakeholder-ready briefs that prioritize clarity and utility.
  </Callout>

  {/* Section 2: Tools I use */}
  <Callout title={<span className="block w-full text-center">Technical Proficiency</span>} tone="slate">
    I leverage a comprehensive technical stack anchored in Python for automated analysis and ArcGIS Pro for advanced spatial workflows. Additionally, I utilize modern web development technologies to craft interactive outreach platforms, ensuring scientific findings are accessible and engaging.
  </Callout>

  {/* Section 3: What I want next */}
  <Callout title={<span className="block w-full text-center">Career Objectives</span>} tone="slate">
    I am seeking professional opportunities at the nexus of climate resilience, wildfire dynamics, and geospatial science. My goal is to apply integrated GIS workflows and strategic science communication to enhance community readiness and optimize response protocols for critical environmental challenges.
  </Callout>
</div>
        </motion.div>
      </Container>

      <Modal
        open={!!activeProject}
        title={activeProject?.title}
        subtitle={activeProject?.subtitle}
        onClose={() => setOpenProjectId(null)}
      >
        {activeProject ? (
          <div>
            <div className="flex flex-wrap gap-2">
              {activeProject.tags?.map((t) => (
                <Badge key={t} tone="sky">
                  {t}
                </Badge>
              ))}
            </div>

            <ul className="mt-5 space-y-3 text-slate-700 dark:text-slate-200">
              {activeProject.details.map((d, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />
                  <span className="leading-relaxed">{d}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Modal>
    </motion.div>
  );
}

function SurveyPage() {
  const { page, fadeInUp } = useMotionPresets();

  return (
    <motion.div {...page}>
      <Container className="px-6 lg:px-12 py-12">
        <motion.div {...fadeInUp}>
          <section
            className={cx(
              "rounded-2xl p-8 shadow-sm ring-1 ring-black/5",
              "bg-emerald-50/70 backdrop-blur",
              "dark:bg-emerald-950/25 dark:ring-emerald-900/50"
            )}
          >
            <SectionHeading
              icon={DocumentTextIcon}
              title="International Student Survey"
              subtitle="Data collection for this phase is now complete."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2">
                {/* Status Banner */}
                <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-100/50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                  <p className="flex items-center gap-2 text-lg font-semibold text-emerald-800 dark:text-emerald-200">
                    <span>🎉</span>
                    Thanks to the over 200 international student respondents!
                  </p>
                  <p className="mt-1 text-emerald-700 dark:text-emerald-300">
                    The survey is currently complete. Raffle winners will be announced in{" "}
                    <span className="font-bold">January</span>.
                  </p>
                </div>

                <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200">
                  I gathered anonymous responses from international students at Mississippi State University to better understand how severe weather is
                  perceived and what information helps most. Your input is vital to this study. Thank you for helping
                  move this research forward.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {/* Disabled Button Indicator */}
                  <button
                    disabled
                    className={cx(
                      "inline-flex cursor-not-allowed items-center justify-center gap-2",
                      "rounded-md bg-slate-200 px-5 py-3 font-semibold text-slate-500 shadow-sm",
                      "dark:bg-slate-800 dark:text-slate-400"
                    )}
                  >
                    Survey Closed
                    <DocumentTextIcon className="h-5 w-5 opacity-50" />
                  </button>

                  <OutlineLink to="/contact">
                    Questions?
                    <EnvelopeIcon className="h-5 w-5" />
                  </OutlineLink>
                </div>

                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                  Note: All responses collected remain anonymous.
                </p>
              </div>

              {/* Sidebar */}
              <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-slate-950 dark:ring-white/10">
                <h4 className="font-semibold text-slate-900 dark:text-slate-50">What the survey helps with</h4>
                <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                  <li className="flex gap-2">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    Identify trusted warning channels
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    Reduce confusion during severe weather
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    Improve culturally responsive communication
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </motion.div>
      </Container>
    </motion.div>
  );
}

function ContactPage() {
  const profile = useProfile();
  const { page, fadeInUp } = useMotionPresets();

  return (
    <motion.div {...page}>
      <Container className="px-6 lg:px-12 py-12">
        <motion.div {...fadeInUp}>
          <section
            className={cx(
              "rounded-2xl p-8 shadow-sm ring-1 ring-black/5",
              "bg-white/70 backdrop-blur",
              "dark:bg-slate-950/60 dark:ring-white/10"
            )}
          >
            {/* The Grid now starts at the very top of the section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
              
              {/* LEFT COLUMN: Heading + Body */}
              <div className="lg:col-span-2 space-y-6">
                <SectionHeading
                  icon={EnvelopeIcon}
                  title="Contact"
                  subtitle="Open to collaborations, internships, and graduate school discussions."
                />

                <p className="text-lg text-slate-700 dark:text-slate-200 leading-relaxed">
                  Whether you’re interested in collaborating on research, discussing internship openings, 
                  or simply want to chat about a shared love for the weather, I’d love to hear from you. 
                  Email is the best way to reach me, and I’m also active on LinkedIn.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row gap-4">
                  <a
                    href={`mailto:${profile.email}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md font-semibold border-2 border-sky-600 text-sky-700 hover:bg-sky-600 hover:text-white transition shadow-sm"
                  >
                    {profile.email}
                    <EnvelopeIcon className="h-5 w-5" />
                  </a>

                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md font-semibold border-2 border-sky-600 text-sky-700 hover:bg-sky-600 hover:text-white transition shadow-sm"
                  >
                    LinkedIn
                    <LinkIcon className="h-5 w-5" />
                  </a>

                  <a
                    href={profile.resume}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md font-semibold text-white shadow-lg bg-gradient-to-r from-sky-600 to-emerald-500 hover:brightness-110 hover:-translate-y-[1px] transition"
                  >
                    View Résumé
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </a>
                </div>
              </div>

              {/* RIGHT COLUMN: Sidebar (Now Aligned to Top) */}
              <div className="rounded-xl bg-sky-50 p-6 ring-1 ring-sky-100 dark:bg-sky-950/40 dark:ring-sky-900/60 shadow-sm">
                <h4 className="font-bold text-sky-900 dark:text-sky-200 uppercase tracking-wide text-xs">
                  Quick details
                </h4>
                
                <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-sky-700 dark:text-sky-400" />
                    Starkville, MS
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-sky-700 dark:text-sky-400" />
                    Graduation: May 2026
                  </div>
                  
                  <div className="pt-4 border-t border-sky-200 dark:border-sky-800">
                    <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-bold uppercase text-[10px] tracking-widest mb-3">
                      <SparklesIcon className="h-4 w-4" />
                      Interests
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Synoptic meteorology",
                        "Wildfire climatology",
                        "Weather and society principles",
                        "Probabilistic modeling",
                        "Statistical methods"
                      ].map((interest) => (
                        <span 
                          key={interest}
                          className="px-2.5 py-1 rounded-md text-[13px] font-medium bg-white/80 text-sky-900 ring-1 ring-sky-200 dark:bg-sky-900/40 dark:text-sky-100 dark:ring-sky-700/50"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* End Sidebar */}

            </div>
          </section>
        </motion.div>
      </Container>
    </motion.div>
  );
}

function NotFoundPage() {
  const { page } = useMotionPresets();
  return (
    <motion.div {...page}>
      <Container className="px-6 lg:px-12 py-16">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5 dark:bg-slate-950 dark:ring-white/10">
          <h1 className="text-3xl font-extrabold">Page not found</h1>
          <p className="mt-3 text-slate-700 dark:text-slate-200">
            That route doesn’t exist. Use the menu to navigate.
          </p>
          <div className="mt-6">
            <PrimaryLink to="/">Go Home</PrimaryLink>
          </div>
        </div>
      </Container>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Export: the multipage router                                                 */
/* -------------------------------------------------------------------------- */

export default function PersonalWebsite() {
  return (
    <SiteLayout>
      <RouteScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/research" element={<ResearchPage />} />
        <Route path="/experience" element={<ExperiencePage />} />
        <Route path="/survey" element={<SurveyPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </SiteLayout>
  );
}
