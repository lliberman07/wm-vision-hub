import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Calculator, Download, Save } from "lucide-react";

interface SimulatorState {
  totalCost: number;
  entranceFeePercentage: number;
  infrastructurePercentage: number;
  equipmentPercentage: number;
  workingCapitalPercentage: number;
  financedPercentage: number;
  financingTermMonths: number;
  interestRate: number;
  insuranceCost: number;
  localSize: number;
  remodelingCostPerM2: number;
}

const FranchiseSimulator = () => {
  const [state, setState] = useState<SimulatorState>({
    totalCost: 100000,
    entranceFeePercentage: 20,
    infrastructurePercentage: 40,
    equipmentPercentage: 20,
    workingCapitalPercentage: 20,
    financedPercentage: 50,
    financingTermMonths: 36,
    interestRate: 0,
    insuranceCost: 2000,
    localSize: 100,
    remodelingCostPerM2: 800,
  });

  const calculations = useMemo(() => {
    const entranceFee = state.totalCost * (state.entranceFeePercentage / 100);
    const infrastructureCost = state.totalCost * (state.infrastructurePercentage / 100);
    const equipmentCost = state.totalCost * (state.equipmentPercentage / 100);
    const workingCapital = state.totalCost * (state.workingCapitalPercentage / 100);
    
    const financedAmount = infrastructureCost * (state.financedPercentage / 100);
    const outOfPocketInfrastructure = infrastructureCost - financedAmount;
    
    // Monthly payment calculation
    let monthlyPayment = 0;
    if (state.interestRate > 0) {
      const monthlyRate = state.interestRate / 100 / 12;
      monthlyPayment = financedAmount * (monthlyRate * Math.pow(1 + monthlyRate, state.financingTermMonths)) / 
                     (Math.pow(1 + monthlyRate, state.financingTermMonths) - 1);
    } else {
      monthlyPayment = financedAmount / state.financingTermMonths;
    }

    const totalUpfront = entranceFee + outOfPocketInfrastructure + equipmentCost + workingCapital;
    const totalRemodelingCost = state.localSize * state.remodelingCostPerM2;
    
    return {
      entranceFee,
      infrastructureCost,
      equipmentCost,
      workingCapital,
      financedAmount,
      outOfPocketInfrastructure,
      monthlyPayment,
      totalUpfront,
      totalRemodelingCost,
    };
  }, [state]);

  const updateState = (updates: Partial<SimulatorState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const chartData = [
    { name: "Entrance Fee", value: calculations.entranceFee, color: "#3b82f6" },
    { name: "Infrastructure", value: calculations.infrastructureCost, color: "#f59e0b" },
    { name: "Equipment", value: calculations.equipmentCost, color: "#10b981" },
    { name: "Working Capital", value: calculations.workingCapital, color: "#8b5cf6" },
  ];

  const barData = [
    { name: "Financed", amount: calculations.financedAmount },
    { name: "Out of Pocket", amount: calculations.outOfPocketInfrastructure },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Franchise Investment Simulator</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Plan your franchise investment with our interactive tool. Adjust variables to see real-time projections of costs and financing options.
        </p>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Settings</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
          <TabsTrigger value="results">Results & Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Franchise Cost</CardTitle>
                <CardDescription>Enter the overall investment required for the franchise</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Label htmlFor="totalCost">Total Cost ($)</Label>
                <Input
                  id="totalCost"
                  type="number"
                  value={state.totalCost}
                  onChange={(e) => updateState({ totalCost: Number(e.target.value) })}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown Percentages</CardTitle>
                <CardDescription>Adjust the allocation of your total investment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Entrance Fee</Label>
                    <span className="text-sm text-muted-foreground">{state.entranceFeePercentage}%</span>
                  </div>
                  <Slider
                    value={[state.entranceFeePercentage]}
                    onValueChange={([value]) => updateState({ entranceFeePercentage: value })}
                    max={100}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Infrastructure & Remodeling</Label>
                    <span className="text-sm text-muted-foreground">{state.infrastructurePercentage}%</span>
                  </div>
                  <Slider
                    value={[state.infrastructurePercentage]}
                    onValueChange={([value]) => updateState({ infrastructurePercentage: value })}
                    max={100}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Equipment & Assets</Label>
                    <span className="text-sm text-muted-foreground">{state.equipmentPercentage}%</span>
                  </div>
                  <Slider
                    value={[state.equipmentPercentage]}
                    onValueChange={([value]) => updateState({ equipmentPercentage: value })}
                    max={100}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Working Capital</Label>
                    <span className="text-sm text-muted-foreground">{state.workingCapitalPercentage}%</span>
                  </div>
                  <Slider
                    value={[state.workingCapitalPercentage]}
                    onValueChange={([value]) => updateState({ workingCapitalPercentage: value })}
                    max={100}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Financing Details</CardTitle>
                <CardDescription>Configure your financing options for infrastructure costs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Financed Percentage</Label>
                    <span className="text-sm text-muted-foreground">{state.financedPercentage}%</span>
                  </div>
                  <Slider
                    value={[state.financedPercentage]}
                    onValueChange={([value]) => updateState({ financedPercentage: value })}
                    max={100}
                    step={5}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="term">Financing Term (months)</Label>
                    <Input
                      id="term"
                      type="number"
                      value={state.financingTermMonths}
                      onChange={(e) => updateState({ financingTermMonths: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rate">Interest Rate (%)</Label>
                    <Input
                      id="rate"
                      type="number"
                      step="0.1"
                      value={state.interestRate}
                      onChange={(e) => updateState({ interestRate: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
                <CardDescription>Specific details about your franchise location</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="size">Local Size (m²)</Label>
                    <Input
                      id="size"
                      type="number"
                      value={state.localSize}
                      onChange={(e) => updateState({ localSize: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="costM2">Cost per m² ($)</Label>
                    <Input
                      id="costM2"
                      type="number"
                      value={state.remodelingCostPerM2}
                      onChange={(e) => updateState({ remodelingCostPerM2: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insurance">Insurance Cost ($)</Label>
                  <Input
                    id="insurance"
                    type="number"
                    value={state.insuranceCost}
                    onChange={(e) => updateState({ insuranceCost: Number(e.target.value) })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
                <CardDescription>Visual representation of your investment allocation</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financing Breakdown</CardTitle>
                <CardDescription>Infrastructure financing vs out-of-pocket costs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                    <Bar dataKey="amount" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
              <CardDescription>Complete breakdown of your franchise investment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Total Investment</Label>
                  <div className="text-2xl font-bold">${state.totalCost.toLocaleString()}</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Upfront Payment</Label>
                  <div className="text-2xl font-bold text-destructive">${calculations.totalUpfront.toLocaleString()}</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Financed Amount</Label>
                  <div className="text-2xl font-bold text-primary">${calculations.financedAmount.toLocaleString()}</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Monthly Payment</Label>
                  <div className="text-2xl font-bold text-accent">${calculations.monthlyPayment.toLocaleString()}</div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h4 className="font-semibold">Detailed Breakdown:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Entrance Fee ({state.entranceFeePercentage}%)</div>
                    <div className="font-medium">${calculations.entranceFee.toLocaleString()}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Infrastructure ({state.infrastructurePercentage}%)</div>
                    <div className="font-medium">${calculations.infrastructureCost.toLocaleString()}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Equipment ({state.equipmentPercentage}%)</div>
                    <div className="font-medium">${calculations.equipmentCost.toLocaleString()}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Working Capital ({state.workingCapitalPercentage}%)</div>
                    <div className="font-medium">${calculations.workingCapital.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <Button className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  Save Scenario
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FranchiseSimulator;