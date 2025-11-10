import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExpenseData {
  id: string;
  contract_id: string;
  property_id: string;
  tenant_id: string;
  category: string;
  amount: number;
  currency: string;
  expense_date: string;
  is_reimbursable: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { expense } = await req.json() as { expense: ExpenseData };

    console.log('Processing reimbursement for expense:', expense.id);

    // Validar que el gasto sea reembolsable y tenga contrato
    if (!expense.is_reimbursable || !expense.contract_id) {
      console.log('Expense is not reimbursable or has no contract, skipping');
      return new Response(
        JSON.stringify({ message: 'Expense is not eligible for reimbursement' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Obtener el contrato y sus propietarios
    const { data: contract, error: contractError } = await supabase
      .from('pms_contracts')
      .select('id, property_id, currency')
      .eq('id', expense.contract_id)
      .single();

    if (contractError || !contract) {
      throw new Error(`Contract not found: ${contractError?.message}`);
    }

    // Obtener los propietarios de la propiedad
    const { data: ownerProperties, error: ownerError } = await supabase
      .from('pms_owner_properties')
      .select(`
        owner_id,
        share_percent,
        pms_owners!inner(id, user_id, first_name, last_name)
      `)
      .eq('property_id', contract.property_id)
      .or('end_date.is.null,end_date.gte.' + new Date().toISOString().split('T')[0]);

    if (ownerError || !ownerProperties || ownerProperties.length === 0) {
      throw new Error(`No active owners found for property: ${ownerError?.message}`);
    }

    console.log(`Found ${ownerProperties.length} owners for property`);

    // Obtener métodos de pago del contrato con sus IDs
    const { data: paymentMethods, error: pmError } = await supabase
      .from('pms_contract_payment_methods')
      .select('id, payment_method, percentage, item')
      .eq('contract_id', expense.contract_id);

    if (pmError) {
      throw new Error(`Error fetching payment methods: ${pmError.message}`);
    }

    // Validar que existan métodos de pago configurados
    if (!paymentMethods || paymentMethods.length === 0) {
      throw new Error('No payment methods configured for contract. Please configure payment methods first.');
    }

    console.log(`Using ${paymentMethods.length} payment methods`);

    // Determinar el período (año-mes) del gasto
    const expenseDate = new Date(expense.expense_date);
    const periodDate = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), 1);
    const periodDateStr = periodDate.toISOString().split('T')[0];

    console.log(`Creating schedule items for period: ${periodDateStr}`);

    // Buscar una proyección existente para este contrato y período
    const { data: existingProjection } = await supabase
      .from('pms_contract_monthly_projections')
      .select('id')
      .eq('contract_id', expense.contract_id)
      .eq('period_date', periodDateStr)
      .limit(1)
      .single();

    let projectionId = existingProjection?.id;

    // Si no existe proyección, crear una para reembolsos
    if (!projectionId) {
      const { data: newProjection, error: projError } = await supabase
        .from('pms_contract_monthly_projections')
        .insert({
          contract_id: expense.contract_id,
          tenant_id: expense.tenant_id,
          period_date: periodDateStr,
          item: `REEMBOLSO_${expense.category.toUpperCase()}`,
          projected_amount: expense.amount,
          currency: expense.currency
        })
        .select('id')
        .single();

      if (projError) {
        throw new Error(`Error creating projection: ${projError.message}`);
      }
      
      projectionId = newProjection.id;
    }

    // Crear items de calendario para cada combinación de owner + payment method
    const scheduleItems = [];
    
    for (const ownerProp of ownerProperties) {
      const owner = ownerProp.pms_owners as any;
      const ownerAmount = expense.amount * (ownerProp.share_percent / 100);

      for (const method of paymentMethods) {
        const methodPercentage = method.percentage || 100;
        const finalAmount = ownerAmount * (methodPercentage / 100);

        const scheduleItem = {
          contract_id: expense.contract_id,
          tenant_id: expense.tenant_id,
          projection_id: projectionId,
          period_date: periodDateStr,
          item: `REEMBOLSO_${expense.category.toUpperCase()}`,
          expected_amount: finalAmount,
          original_amount: finalAmount,
          status: 'pending',
          owner_id: owner.id,
          owner_percentage: ownerProp.share_percent,
          payment_method_id: method.id,
          expense_id: expense.id
        };

        scheduleItems.push(scheduleItem);
      }
    }

    console.log(`Inserting ${scheduleItems.length} schedule items`);

    // Insertar los items
    const { data: insertedItems, error: insertError } = await supabase
      .from('pms_payment_schedule_items')
      .insert(scheduleItems)
      .select('id');

    if (insertError) {
      throw new Error(`Error creating schedule items: ${insertError.message}`);
    }

    console.log(`Successfully created ${insertedItems.length} schedule items`);

    // Actualizar el gasto con el primer schedule_item_id y cambiar status
    if (insertedItems && insertedItems.length > 0) {
      const { error: updateError } = await supabase
        .from('pms_expenses')
        .update({
          schedule_item_id: insertedItems[0].id,
          reimbursement_status: 'included_in_schedule'
        })
        .eq('id', expense.id);

      if (updateError) {
        console.error('Error updating expense:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        itemsCreated: scheduleItems.length,
        message: `Created ${scheduleItems.length} reimbursement schedule items`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in create-reimbursement-schedule-item:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
