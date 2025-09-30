import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  FileText, 
  Building2, 
  User, 
  Upload,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProjectFolderProps {
  simulationResults?: any;
  onBack: () => void;
}

export const ProjectFolder = ({ simulationResults, onBack }: ProjectFolderProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [applicantType, setApplicantType] = useState<"individual" | "company">("individual");
  
  const [formData, setFormData] = useState({
    // Individual data
    firstName: "",
    lastName: "",
    documentId: "",
    email: "",
    phone: "",
    
    // Company data
    companyName: "",
    taxId: "",
    legalRepName: "",
    
    // Common data
    address: "",
    projectDescription: "",
    requestedAmount: "",
    
    // Documents
    documents: [] as File[]
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, ...Array.from(e.target.files!)]
      }));
    }
  };

  const handleSubmit = async () => {
    toast({
      title: t("projectFolder.success.title"),
      description: t("projectFolder.success.description"),
    });
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base mb-4 block">{t("projectFolder.step1.typeLabel")}</Label>
              <RadioGroup value={applicantType} onValueChange={(val) => setApplicantType(val as "individual" | "company")}>
                <div className="grid grid-cols-2 gap-4">
                  <Card className={`cursor-pointer transition-all ${applicantType === "individual" ? "ring-2 ring-primary" : ""}`}>
                    <CardContent className="p-6 flex items-center space-x-4">
                      <RadioGroupItem value="individual" id="individual" />
                      <Label htmlFor="individual" className="cursor-pointer flex items-center space-x-3 flex-1">
                        <User className="h-8 w-8 text-primary" />
                        <div>
                          <div className="font-semibold">{t("projectFolder.step1.individual")}</div>
                          <div className="text-sm text-muted-foreground">{t("projectFolder.step1.individualDesc")}</div>
                        </div>
                      </Label>
                    </CardContent>
                  </Card>

                  <Card className={`cursor-pointer transition-all ${applicantType === "company" ? "ring-2 ring-primary" : ""}`}>
                    <CardContent className="p-6 flex items-center space-x-4">
                      <RadioGroupItem value="company" id="company" />
                      <Label htmlFor="company" className="cursor-pointer flex items-center space-x-3 flex-1">
                        <Building2 className="h-8 w-8 text-primary" />
                        <div>
                          <div className="font-semibold">{t("projectFolder.step1.company")}</div>
                          <div className="text-sm text-muted-foreground">{t("projectFolder.step1.companyDesc")}</div>
                        </div>
                      </Label>
                    </CardContent>
                  </Card>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {applicantType === "individual" ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">{t("projectFolder.step2.firstName")}</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder={t("projectFolder.step2.firstNamePlaceholder")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">{t("projectFolder.step2.lastName")}</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder={t("projectFolder.step2.lastNamePlaceholder")}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="documentId">{t("projectFolder.step2.documentId")}</Label>
                  <Input
                    id="documentId"
                    value={formData.documentId}
                    onChange={(e) => handleInputChange("documentId", e.target.value)}
                    placeholder={t("projectFolder.step2.documentIdPlaceholder")}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="companyName">{t("projectFolder.step2.companyName")}</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    placeholder={t("projectFolder.step2.companyNamePlaceholder")}
                  />
                </div>
                <div>
                  <Label htmlFor="taxId">{t("projectFolder.step2.taxId")}</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => handleInputChange("taxId", e.target.value)}
                    placeholder={t("projectFolder.step2.taxIdPlaceholder")}
                  />
                </div>
                <div>
                  <Label htmlFor="legalRepName">{t("projectFolder.step2.legalRep")}</Label>
                  <Input
                    id="legalRepName"
                    value={formData.legalRepName}
                    onChange={(e) => handleInputChange("legalRepName", e.target.value)}
                    placeholder={t("projectFolder.step2.legalRepPlaceholder")}
                  />
                </div>
              </>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">{t("projectFolder.step2.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder={t("projectFolder.step2.emailPlaceholder")}
                />
              </div>
              <div>
                <Label htmlFor="phone">{t("projectFolder.step2.phone")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder={t("projectFolder.step2.phonePlaceholder")}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">{t("projectFolder.step2.address")}</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder={t("projectFolder.step2.addressPlaceholder")}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="projectDescription">{t("projectFolder.step3.projectDescription")}</Label>
              <Textarea
                id="projectDescription"
                value={formData.projectDescription}
                onChange={(e) => handleInputChange("projectDescription", e.target.value)}
                placeholder={t("projectFolder.step3.descriptionPlaceholder")}
                rows={6}
              />
            </div>

            <div>
              <Label htmlFor="requestedAmount">{t("projectFolder.step3.requestedAmount")}</Label>
              <Input
                id="requestedAmount"
                type="number"
                value={formData.requestedAmount}
                onChange={(e) => handleInputChange("requestedAmount", e.target.value)}
                placeholder={t("projectFolder.step3.amountPlaceholder")}
              />
            </div>

            <div>
              <Label>{t("projectFolder.step3.documents")}</Label>
              <div className="mt-2 border-2 border-dashed border-muted rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  {t("projectFolder.step3.uploadDesc")}
                </p>
                <Input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button variant="outline" asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {t("projectFolder.step3.selectFiles")}
                  </label>
                </Button>
                {formData.documents.length > 0 && (
                  <div className="mt-4 text-left space-y-2">
                    {formData.documents.map((file, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-sm">
                        <FileText className="h-4 w-4 text-primary" />
                        <span>{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <div className="flex items-center space-x-2 text-primary mb-4">
                <CheckCircle2 className="h-6 w-6" />
                <h3 className="font-semibold text-lg">{t("projectFolder.step4.reviewTitle")}</h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">{t("projectFolder.step4.type")}:</span>
                  <span className="ml-2">{applicantType === "individual" ? t("projectFolder.step1.individual") : t("projectFolder.step1.company")}</span>
                </div>
                
                {applicantType === "individual" ? (
                  <div>
                    <span className="font-medium">{t("projectFolder.step4.name")}:</span>
                    <span className="ml-2">{formData.firstName} {formData.lastName}</span>
                  </div>
                ) : (
                  <div>
                    <span className="font-medium">{t("projectFolder.step2.companyName")}:</span>
                    <span className="ml-2">{formData.companyName}</span>
                  </div>
                )}
                
                <div>
                  <span className="font-medium">{t("projectFolder.step2.email")}:</span>
                  <span className="ml-2">{formData.email}</span>
                </div>
                
                <div>
                  <span className="font-medium">{t("projectFolder.step2.phone")}:</span>
                  <span className="ml-2">{formData.phone}</span>
                </div>
                
                <div>
                  <span className="font-medium">{t("projectFolder.step3.requestedAmount")}:</span>
                  <span className="ml-2">{formData.requestedAmount}</span>
                </div>
                
                <div>
                  <span className="font-medium">{t("projectFolder.step3.documents")}:</span>
                  <span className="ml-2">{formData.documents.length} {t("projectFolder.step4.filesUploaded")}</span>
                </div>
              </div>

              {simulationResults && (
                <div className="mt-6 pt-6 border-t border-muted">
                  <h4 className="font-semibold mb-3">{t("projectFolder.step4.simulationAttached")}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t("projectFolder.step4.simulationDesc")}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                {t("projectFolder.step4.disclaimer")}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("projectFolder.backToSimulator")}
        </Button>
        
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4].map((num) => (
            <div
              key={num}
              className={`h-2 w-12 rounded-full transition-all ${
                num === step ? "bg-primary" : num < step ? "bg-primary/50" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t(`projectFolder.step${step}.title`)}</CardTitle>
          <CardDescription>{t(`projectFolder.step${step}.description`)}</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px]">
          {renderStepContent()}

          <div className="flex justify-between mt-8 pt-6 border-t">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("common.back")}
              </Button>
            )}
            
            <div className="ml-auto">
              {step < 4 ? (
                <Button onClick={() => setStep(step + 1)}>
                  {t("common.next")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="bg-primary">
                  <Send className="mr-2 h-4 w-4" />
                  {t("projectFolder.step4.submit")}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
