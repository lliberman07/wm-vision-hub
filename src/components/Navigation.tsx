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
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center">
          {/* Logo - Fixed width */}
          <div className="w-64 flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">W</span>
              </div>
              <span className="font-bold text-xl text-foreground">WM Management</span>
            </Link>
          </div>

          {/* Desktop Navigation - Centered with fixed positioning */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-4xl mx-auto">
            <div className="flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors hover:text-primary whitespace-nowrap min-w-[80px] text-center ${
                    isActive(item.href)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side controls - Fixed width */}
          <div className="hidden md:flex items-center space-x-2 w-64 justify-end flex-shrink-0">
            <LanguageSwitcher variant="header" />
            <Button variant="default" size="sm" className="whitespace-nowrap" asChild>
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