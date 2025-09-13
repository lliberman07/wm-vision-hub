import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { href: "/", label: t('nav.home') },
    { href: "/about", label: t('nav.about') },
    { href: "/services", label: t('nav.services') },
    { href: "/industries", label: t('nav.industries') },
    { href: "/financing", label: t('nav.financing') },
    { href: "/contact", label: t('nav.contact') },
    { href: "/faq", label: t('nav.faq') },
  ];

  const isActive = (href: string) => {
    if (href === "/" && location.pathname === "/") return true;
    if (href !== "/" && location.pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex h-20 items-center">
          {/* Logo - Professional branding */}
          <div className="w-48 flex-shrink-0">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="text-2xl font-display font-bold text-primary group-hover:text-primary-hover transition-colors duration-300">
                WM<span className="text-accent">.</span>
              </div>
              <div className="hidden sm:block text-sm font-medium text-muted-foreground">
                Management
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Professional spacing */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className="flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`nav-link text-sm font-medium whitespace-nowrap min-w-[80px] text-center ${
                    isActive(item.href)
                      ? "text-primary active"
                      : "text-foreground/80"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side controls - Premium styling */}
          <div className="hidden md:flex items-center space-x-4 w-48 justify-end flex-shrink-0">
            <LanguageSwitcher variant="header" />
            <Button variant="outline" size="sm" className="shadow-sm" asChild>
              <Link to="/auth">Admin</Link>
            </Button>
            <Button variant="default" size="sm" className="btn-premium shadow-md" asChild>
              <Link to="/financing/signup">{t('nav.getStarted')}</Link>
            </Button>
          </div>

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-3 mt-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`px-3 py-2 text-base font-medium rounded-md transition-colors ${
                      isActive(item.href)
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="mt-4 space-y-3">
                  <LanguageSwitcher variant="header" />
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      Admin Access
                    </Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link to="/financing/signup" onClick={() => setIsOpen(false)}>
                      {t('nav.getStarted')}
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;