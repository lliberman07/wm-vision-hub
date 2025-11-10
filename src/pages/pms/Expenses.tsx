import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePMS } from "@/contexts/PMSContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExpenseForm } from "@/components/pms/ExpenseForm";
import { ReprocessReimbursementButton } from "@/components/pms/ReprocessReimbursementButton";
import { Plus, Search, FileText } from "lucide-react";
import { format } from "date-fns";
import { PMSLayout } from "@/components/pms/PMSLayout";

interface Expense {
  id: string;
  category: string;
  amount: number;
  currency: string;
  expense_date: string;
  description: string;
  receipt_url: string;
  contract_id?: string;
  property_id: string;
  tenant_id: string;
  is_reimbursable?: boolean;
  reimbursement_status?: string;
  schedule_item_id?: string;
  pms_properties?: { code: string; address: string };
}

export default function Expenses() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPMSAccess, currentTenant, loading: pmsLoading } = usePMS();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | undefined>();

  useEffect(() => {
    if (pmsLoading) return;
    
    if (!user || !hasPMSAccess) {
      navigate('/pms/login');
      return;
    }
    fetchExpenses();
  }, [pmsLoading, user?.id, hasPMSAccess, navigate]);

  const fetchExpenses = async () => {
    if (!currentTenant?.id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('pms_expenses')
      .select(`
        *,
        pms_properties!inner(code, address)
      `)
      .eq('tenant_id', currentTenant.id)
      .order('expense_date', { ascending: false });

    if (!error && data) {
      setExpenses(data as any);
    }
    setLoading(false);
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (expense.pms_properties as any)?.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PMSLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gastos</h1>
            <p className="text-muted-foreground">{currentTenant?.name}</p>
          </div>
          <Button onClick={() => {
            setSelectedExpense(undefined);
            setIsFormOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Gasto
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Lista de Gastos</span>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar gastos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando...</div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron gastos
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Propiedad</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Comprobante</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow
                      key={expense.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedExpense(expense);
                        setIsFormOpen(true);
                      }}
                    >
                      <TableCell>{format(new Date(expense.expense_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        {(expense.pms_properties as any)?.code}
                        <div className="text-xs text-muted-foreground">
                          {(expense.pms_properties as any)?.address}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                      <TableCell className="text-right font-mono">
                        {expense.currency} {expense.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {expense.is_reimbursable ? (
                          <Badge 
                            variant={
                              !expense.schedule_item_id ? 'destructive' :
                              expense.reimbursement_status === 'paid' ? 'default' : 
                              'secondary'
                            }
                          >
                            {!expense.schedule_item_id ? 'Error' :
                             expense.reimbursement_status === 'paid' ? 'Reembolsado' :
                             expense.reimbursement_status === 'included_in_schedule' ? 'En calendario' :
                             'Pendiente'}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Gasto</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {expense.receipt_url && (
                          <a
                            href={expense.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary hover:underline"
                          >
                            <FileText className="h-4 w-4" />
                          </a>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {expense.is_reimbursable && !expense.schedule_item_id && expense.contract_id && (
                          <ReprocessReimbursementButton
                            expense={{
                              id: expense.id,
                              category: expense.category,
                              amount: expense.amount,
                              contract_id: expense.contract_id,
                              property_id: expense.property_id,
                              tenant_id: expense.tenant_id,
                              currency: expense.currency,
                              expense_date: expense.expense_date,
                              is_reimbursable: expense.is_reimbursable
                            }}
                            onSuccess={fetchExpenses}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {currentTenant && (
          <ExpenseForm
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSuccess={fetchExpenses}
            expense={selectedExpense}
            tenantId={currentTenant.id}
          />
        )}
      </div>
    </PMSLayout>
  );
}
