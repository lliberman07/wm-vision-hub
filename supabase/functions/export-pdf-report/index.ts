import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

interface ExportRequest {
  email: string;
  simulationData: any;
  analysisResults: any;
}

const generatePDFContent = (simulationData: any, analysisResults: any, referenceNumber: string) => {
  const selectedItems = simulationData.filter((item: any) => item.isSelected);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Investment Simulation Report - ${referenceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #3b82f6; }
    .ref-number { font-size: 14px; color: #666; margin-top: 10px; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #3b82f6; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
    .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
    .metric-card { padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
    .metric-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
    .metric-label { font-size: 14px; color: #666; margin-top: 5px; }
    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .items-table th { background-color: #f9fafb; font-weight: bold; }
    .alert { padding: 15px; margin: 10px 0; border-radius: 8px; }
    .alert-warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; }
    .alert-error { background-color: #fef2f2; border-left: 4px solid #ef4444; }
    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">WM Management</div>
    <h1>Investment Simulation Report</h1>
    <div class="ref-number">Reference: ${referenceNumber}</div>
    <div class="ref-number">Generated: ${new Date().toLocaleDateString()}</div>
  </div>

  <div class="section">
    <h2>Executive Summary</h2>
    <div class="summary-grid">
      <div class="metric-card">
        <div class="metric-value">$${Math.round(analysisResults.totalInvestment).toLocaleString()}</div>
        <div class="metric-label">Total Investment</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">$${Math.round(analysisResults.totalFinanced).toLocaleString()}</div>
        <div class="metric-label">Total Financed</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${analysisResults.roi}%</div>
        <div class="metric-label">Return on Investment</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${analysisResults.breakEvenMonths} months</div>
        <div class="metric-label">Break-even Period</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Selected Investment Items</h2>
    <table class="items-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Category</th>
          <th>Amount</th>
          <th>Advance</th>
          <th>Credit Type</th>
        </tr>
      </thead>
      <tbody>
        ${selectedItems.map((item: any) => `
          <tr>
            <td>${item.name}</td>
            <td>${item.category || 'General'}</td>
            <td>$${Math.round(item.amount).toLocaleString()}</td>
            <td>$${Math.round(item.advance).toLocaleString()}</td>
            <td>${item.creditType}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>This report was generated automatically by the WM Management investment simulation system.</p>
    <p>For questions or support, please contact our team.</p>
  </div>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, simulationData, analysisResults }: ExportRequest = await req.json();

    console.log('Processing PDF export request for:', email);

    // Generate reference number
    const { data: refData } = await supabase.rpc('generate_reference_number');
    const referenceNumber = refData || `SIM-${Date.now()}`;

    // Save simulation to database
    const { data: simulation, error: simError } = await supabase
      .from('investment_simulations')
      .insert({
        reference_number: referenceNumber,
        user_email: email,
        simulation_data: simulationData,
        analysis_results: analysisResults
      })
      .select()
      .single();

    if (simError) {
      console.error('Database error:', simError);
      throw new Error('Failed to save simulation');
    }

    // Create PDF request record
    const { error: requestError } = await supabase
      .from('pdf_report_requests')
      .insert({
        simulation_id: simulation.id,
        user_email: email,
        status: 'processing'
      });

    if (requestError) {
      console.error('PDF request error:', requestError);
    }

    // Generate PDF content
    const htmlContent = generatePDFContent(simulationData, analysisResults, referenceNumber);

    // Send email with PDF using Puppeteer via service
    try {
      const emailResponse = await resend.emails.send({
        from: 'WM Management <reports@wm.resend.dev>',
        to: [email],
        subject: `Investment Simulation Report - ${referenceNumber}`,
        html: `
          <h2>Your Investment Simulation Report is Ready</h2>
          <p>Thank you for using our investment simulation tool. Your personalized report has been generated.</p>
          
          <h3>Report Summary:</h3>
          <ul>
            <li><strong>Reference Number:</strong> ${referenceNumber}</li>
            <li><strong>Total Investment:</strong> $${Math.round(analysisResults.totalInvestment).toLocaleString()}</li>
            <li><strong>Total Financed:</strong> $${Math.round(analysisResults.totalFinanced).toLocaleString()}</li>
            <li><strong>ROI:</strong> ${analysisResults.roi}%</li>
            <li><strong>Break-even Period:</strong> ${analysisResults.breakEvenMonths} months</li>
          </ul>
          
          <p>The detailed PDF report is attached to this email.</p>
          
          <hr>
          <p style="font-size: 12px; color: #666;">
            This report was generated on ${new Date().toLocaleDateString()} by WM Management's investment simulation system.
          </p>
        `,
        attachments: [
          {
            filename: `investment-report-${referenceNumber}.html`,
            content: btoa(htmlContent),
            content_type: 'text/html'
          }
        ]
      });

      console.log('Email sent successfully:', emailResponse);

      // Update request status to completed
      await supabase
        .from('pdf_report_requests')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('simulation_id', simulation.id);

    } catch (emailError: any) {
      console.error('Email sending failed:', emailError);
      
      // Update request status to failed
      await supabase
        .from('pdf_report_requests')
        .update({ 
          status: 'failed',
          error_message: emailError.message
        })
        .eq('simulation_id', simulation.id);

      throw new Error('Failed to send email');
    }

    return new Response(JSON.stringify({ 
      success: true,
      referenceNumber,
      simulationId: simulation.id
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in export-pdf-report function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);