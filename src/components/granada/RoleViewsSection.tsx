import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, User, Home } from "lucide-react";
import { useGranadaLanguage } from "@/contexts/GranadaLanguageContext";

export function RoleViewsSection() {
  const { t } = useGranadaLanguage();

  const roles = [
    {
      titleKey: 'roles.admin_title',
      icon: Building2,
      descKey: 'roles.admin_desc',
      featureKeys: [
        'roles.admin_feature1',
        'roles.admin_feature2',
        'roles.admin_feature3',
        'roles.admin_feature4',
      ],
    },
    {
      titleKey: 'roles.owner_title',
      icon: User,
      descKey: 'roles.owner_desc',
      featureKeys: [
        'roles.owner_feature1',
        'roles.owner_feature2',
        'roles.owner_feature3',
        'roles.owner_feature4',
      ],
    },
    {
      titleKey: 'roles.tenant_title',
      icon: Home,
      descKey: 'roles.tenant_desc',
      featureKeys: [
        'roles.tenant_feature1',
        'roles.tenant_feature2',
        'roles.tenant_feature3',
        'roles.tenant_feature4',
      ],
    },
  ];

  return (
    <div className="mt-12">
      <h3 className="text-2xl font-bold text-center mb-8">
        {t('roles.title')}
      </h3>
      <div className="grid md:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card key={role.titleKey} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <role.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{t(role.titleKey)}</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                {t(role.descKey)}
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {role.featureKeys.map((featureKey, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{t(featureKey)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
