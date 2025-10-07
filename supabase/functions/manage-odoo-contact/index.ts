import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OdooConfig {
  url: string;
  database: string;
  username: string;
  apiKey: string;
}

interface ContactData {
  name: string;
  email?: string;
  phone?: string;
  street?: string;
  street2?: string;
  city?: string;
  state_id?: number;
  state_name?: string;
  zip?: string;
  country_id?: number;
  country_code?: string;
  website?: string;
  vat?: string;
  l10n_ar_afip_responsibility_type_id?: string;
  company_type: 'person' | 'company';
  function?: string;
  parent_id?: number;
  parent_name?: string;
  category_id?: Array<[number, number, number[]]>;
  category_names?: string[];
}

interface RequestBody {
  action: 'search' | 'create' | 'update';
  searchTerm?: string;
  contactId?: number;
  contactData?: ContactData;
}

async function authenticateOdoo(config: OdooConfig): Promise<number> {
  console.log('Authenticating with Odoo...');
  
  const authResponse = await fetch(`${config.url}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'common',
        method: 'authenticate',
        args: [config.database, config.username, config.apiKey, {}]
      },
      id: Math.random()
    })
  });

  const authData = await authResponse.json();
  console.log('Authentication response:', authData);

  if (authData.error) {
    throw new Error(`Odoo authentication failed: ${JSON.stringify(authData.error)}`);
  }

  if (!authData.result) {
    throw new Error('Authentication failed: No user ID returned');
  }

  console.log('Authenticated successfully, UID:', authData.result);
  return authData.result;
}

async function searchContacts(config: OdooConfig, uid: number, searchTerm: string) {
  console.log('Searching contacts with term:', searchTerm);

  const searchResponse = await fetch(`${config.url}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'object',
        method: 'execute_kw',
        args: [
          config.database,
          uid,
          config.apiKey,
          'res.partner',
          'search_read',
          [
            [
              '|', '|',
              ['email', 'ilike', searchTerm],
              ['vat', 'ilike', searchTerm],
              ['name', 'ilike', searchTerm]
            ]
          ],
          {
            fields: [
              'id', 'name', 'email', 'phone', 'street', 'street2',
              'city', 'state_id', 'zip', 'country_id', 'website', 'vat',
              'company_type', 'function', 'parent_id', 'category_id'
            ],
            limit: 10
          }
        ]
      },
      id: Math.random()
    })
  });

  const searchData = await searchResponse.json();
  console.log('Search response:', searchData);

  if (searchData.error) {
    throw new Error(`Search failed: ${JSON.stringify(searchData.error)}`);
  }

  return searchData.result || [];
}

async function createContact(config: OdooConfig, uid: number, contactData: ContactData) {
  console.log('Creating contact with data:', contactData);

  // Prepare the contact data for Odoo
  const odooData: any = { ...contactData };
  
  // Handle country - search by code
  if (contactData.country_code) {
    try {
      const countrySearch = await fetch(`${config.url}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            service: 'object',
            method: 'execute_kw',
            args: [
              config.database,
              uid,
              config.apiKey,
              'res.country',
              'search_read',
              [[['code', '=', contactData.country_code]]],
              { fields: ['id'], limit: 1 }
            ]
          },
          id: Math.random()
        })
      });
      const countryData = await countrySearch.json();
      if (countryData.result && countryData.result.length > 0) {
        odooData.country_id = countryData.result[0].id;
      }
    } catch (error) {
      console.error('Error finding country:', error);
    }
    delete odooData.country_code;
  }

  // Handle state/province - search by name
  if (contactData.state_name && odooData.country_id) {
    try {
      const stateSearch = await fetch(`${config.url}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            service: 'object',
            method: 'execute_kw',
            args: [
              config.database,
              uid,
              config.apiKey,
              'res.country.state',
              'search_read',
              [[['name', 'ilike', contactData.state_name], ['country_id', '=', odooData.country_id]]],
              { fields: ['id'], limit: 1 }
            ]
          },
          id: Math.random()
        })
      });
      const stateData = await stateSearch.json();
      if (stateData.result && stateData.result.length > 0) {
        odooData.state_id = stateData.result[0].id;
      }
    } catch (error) {
      console.error('Error finding state:', error);
    }
    delete odooData.state_name;
  }

  // Handle ARCA Responsibility Type - search by name
  if (contactData.l10n_ar_afip_responsibility_type_id) {
    try {
      console.log('Searching for ARCA responsibility type:', contactData.l10n_ar_afip_responsibility_type_id);
      
      // Convert underscore format to readable name
      const readableName = contactData.l10n_ar_afip_responsibility_type_id
        .replace(/_/g, ' ')
        .replace(/IVA /g, 'IVA ')
        .trim();
      
      console.log('Readable name for search:', readableName);
      
      const arcaSearch = await fetch(`${config.url}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            service: 'object',
            method: 'execute_kw',
            args: [
              config.database,
              uid,
              config.apiKey,
              'l10n_ar.afip.responsibility.type',
              'search_read',
              [[['name', 'ilike', readableName]]],
              { fields: ['id', 'name', 'code'], limit: 5 }
            ]
          },
          id: Math.random()
        })
      });
      const arcaData = await arcaSearch.json();
      console.log('ARCA search result:', JSON.stringify(arcaData));
      
      if (arcaData.result && arcaData.result.length > 0) {
        odooData.l10n_ar_afip_responsibility_type_id = arcaData.result[0].id;
        console.log('Found ARCA responsibility type ID:', arcaData.result[0].id);
      } else {
        console.log('ARCA responsibility type not found, removing field');
        delete odooData.l10n_ar_afip_responsibility_type_id;
      }
    } catch (error) {
      console.error('Error finding ARCA responsibility type:', error);
      delete odooData.l10n_ar_afip_responsibility_type_id;
    }
  }

  // Handle tags - search or create
  if (contactData.category_names && contactData.category_names.length > 0) {
    try {
      const tagIds: number[] = [];
      for (const tagName of contactData.category_names) {
        const tagSearch = await fetch(`${config.url}/jsonrpc`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: {
              service: 'object',
              method: 'execute_kw',
              args: [
                config.database,
                uid,
                config.apiKey,
                'res.partner.category',
                'search_read',
                [[['name', '=', tagName]]],
                { fields: ['id'], limit: 1 }
              ]
            },
            id: Math.random()
          })
        });
        const tagData = await tagSearch.json();
        if (tagData.result && tagData.result.length > 0) {
          tagIds.push(tagData.result[0].id);
        } else {
          // Create tag if it doesn't exist
          const createTag = await fetch(`${config.url}/jsonrpc`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'call',
              params: {
                service: 'object',
                method: 'execute_kw',
                args: [
                  config.database,
                  uid,
                  config.apiKey,
                  'res.partner.category',
                  'create',
                  [{ name: tagName }]
                ]
              },
              id: Math.random()
            })
          });
          const newTagData = await createTag.json();
          if (newTagData.result) {
            tagIds.push(newTagData.result);
          }
        }
      }
      if (tagIds.length > 0) {
        odooData.category_id = [[6, 0, tagIds]];
      }
    } catch (error) {
      console.error('Error handling tags:', error);
    }
    delete odooData.category_names;
  }

  // Handle parent company for persons
  if (contactData.parent_name && contactData.company_type === 'person') {
    try {
      const companySearch = await fetch(`${config.url}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            service: 'object',
            method: 'execute_kw',
            args: [
              config.database,
              uid,
              config.apiKey,
              'res.partner',
              'search_read',
              [[['name', 'ilike', contactData.parent_name], ['is_company', '=', true]]],
              { fields: ['id'], limit: 1 }
            ]
          },
          id: Math.random()
        })
      });
      const companyData = await companySearch.json();
      if (companyData.result && companyData.result.length > 0) {
        odooData.parent_id = companyData.result[0].id;
      }
    } catch (error) {
      console.error('Error finding parent company:', error);
    }
    delete odooData.parent_name;
  }

  const createResponse = await fetch(`${config.url}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'object',
        method: 'execute_kw',
        args: [
          config.database,
          uid,
          config.apiKey,
          'res.partner',
          'create',
          [odooData]
        ]
      },
      id: Math.random()
    })
  });

  const createData = await createResponse.json();
  console.log('Create response:', createData);

  if (createData.error) {
    throw new Error(`Contact creation failed: ${JSON.stringify(createData.error)}`);
  }

  return createData.result;
}

async function updateContact(config: OdooConfig, uid: number, contactId: number, contactData: ContactData) {
  console.log('Updating contact ID:', contactId, 'with data:', contactData);

  // Prepare the contact data for Odoo (same logic as create)
  const odooData: any = { ...contactData };
  
  // Handle country - search by code
  if (contactData.country_code) {
    try {
      const countrySearch = await fetch(`${config.url}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            service: 'object',
            method: 'execute_kw',
            args: [
              config.database,
              uid,
              config.apiKey,
              'res.country',
              'search_read',
              [[['code', '=', contactData.country_code]]],
              { fields: ['id'], limit: 1 }
            ]
          },
          id: Math.random()
        })
      });
      const countryData = await countrySearch.json();
      if (countryData.result && countryData.result.length > 0) {
        odooData.country_id = countryData.result[0].id;
      }
    } catch (error) {
      console.error('Error finding country:', error);
    }
    delete odooData.country_code;
  }

  // Handle state/province - search by name
  if (contactData.state_name && odooData.country_id) {
    try {
      const stateSearch = await fetch(`${config.url}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            service: 'object',
            method: 'execute_kw',
            args: [
              config.database,
              uid,
              config.apiKey,
              'res.country.state',
              'search_read',
              [[['name', 'ilike', contactData.state_name], ['country_id', '=', odooData.country_id]]],
              { fields: ['id'], limit: 1 }
            ]
          },
          id: Math.random()
        })
      });
      const stateData = await stateSearch.json();
      if (stateData.result && stateData.result.length > 0) {
        odooData.state_id = stateData.result[0].id;
      }
    } catch (error) {
      console.error('Error finding state:', error);
    }
    delete odooData.state_name;
  }

  // Handle ARCA Responsibility Type - search by name
  if (contactData.l10n_ar_afip_responsibility_type_id) {
    try {
      console.log('Searching for ARCA responsibility type:', contactData.l10n_ar_afip_responsibility_type_id);
      
      // Convert underscore format to readable name
      const readableName = contactData.l10n_ar_afip_responsibility_type_id
        .replace(/_/g, ' ')
        .replace(/IVA /g, 'IVA ')
        .trim();
      
      console.log('Readable name for search:', readableName);
      
      const arcaSearch = await fetch(`${config.url}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            service: 'object',
            method: 'execute_kw',
            args: [
              config.database,
              uid,
              config.apiKey,
              'l10n_ar.afip.responsibility.type',
              'search_read',
              [[['name', 'ilike', readableName]]],
              { fields: ['id', 'name', 'code'], limit: 5 }
            ]
          },
          id: Math.random()
        })
      });
      const arcaData = await arcaSearch.json();
      console.log('ARCA search result:', JSON.stringify(arcaData));
      
      if (arcaData.result && arcaData.result.length > 0) {
        odooData.l10n_ar_afip_responsibility_type_id = arcaData.result[0].id;
        console.log('Found ARCA responsibility type ID:', arcaData.result[0].id);
      } else {
        console.log('ARCA responsibility type not found, removing field');
        delete odooData.l10n_ar_afip_responsibility_type_id;
      }
    } catch (error) {
      console.error('Error finding ARCA responsibility type:', error);
      delete odooData.l10n_ar_afip_responsibility_type_id;
    }
  }

  // Handle tags - search or create
  if (contactData.category_names && contactData.category_names.length > 0) {
    try {
      const tagIds: number[] = [];
      for (const tagName of contactData.category_names) {
        const tagSearch = await fetch(`${config.url}/jsonrpc`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: {
              service: 'object',
              method: 'execute_kw',
              args: [
                config.database,
                uid,
                config.apiKey,
                'res.partner.category',
                'search_read',
                [[['name', '=', tagName]]],
                { fields: ['id'], limit: 1 }
              ]
            },
            id: Math.random()
          })
        });
        const tagData = await tagSearch.json();
        if (tagData.result && tagData.result.length > 0) {
          tagIds.push(tagData.result[0].id);
        } else {
          // Create tag if it doesn't exist
          const createTag = await fetch(`${config.url}/jsonrpc`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'call',
              params: {
                service: 'object',
                method: 'execute_kw',
                args: [
                  config.database,
                  uid,
                  config.apiKey,
                  'res.partner.category',
                  'create',
                  [{ name: tagName }]
                ]
              },
              id: Math.random()
            })
          });
          const newTagData = await createTag.json();
          if (newTagData.result) {
            tagIds.push(newTagData.result);
          }
        }
      }
      if (tagIds.length > 0) {
        odooData.category_id = [[6, 0, tagIds]];
      }
    } catch (error) {
      console.error('Error handling tags:', error);
    }
    delete odooData.category_names;
  }

  // Handle parent company for persons
  if (contactData.parent_name && contactData.company_type === 'person') {
    try {
      const companySearch = await fetch(`${config.url}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            service: 'object',
            method: 'execute_kw',
            args: [
              config.database,
              uid,
              config.apiKey,
              'res.partner',
              'search_read',
              [[['name', 'ilike', contactData.parent_name], ['is_company', '=', true]]],
              { fields: ['id'], limit: 1 }
            ]
          },
          id: Math.random()
        })
      });
      const companyData = await companySearch.json();
      if (companyData.result && companyData.result.length > 0) {
        odooData.parent_id = companyData.result[0].id;
      }
    } catch (error) {
      console.error('Error finding parent company:', error);
    }
    delete odooData.parent_name;
  }

  const updateResponse = await fetch(`${config.url}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'object',
        method: 'execute_kw',
        args: [
          config.database,
          uid,
          config.apiKey,
          'res.partner',
          'write',
          [[contactId], odooData]
        ]
      },
      id: Math.random()
    })
  });

  const updateData = await updateResponse.json();
  console.log('Update response:', updateData);

  if (updateData.error) {
    throw new Error(`Contact update failed: ${JSON.stringify(updateData.error)}`);
  }

  return updateData.result;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const config: OdooConfig = {
      url: Deno.env.get('ODOO_URL') || '',
      database: Deno.env.get('ODOO_DATABASE') || '',
      username: Deno.env.get('ODOO_USERNAME') || '',
      apiKey: Deno.env.get('ODOO_API_KEY') || '',
    };

    // Validate configuration
    if (!config.url || !config.database || !config.username || !config.apiKey) {
      throw new Error('Missing Odoo configuration. Please check environment variables.');
    }

    console.log('Odoo Config:', {
      url: config.url,
      database: config.database,
      username: config.username,
      apiKeyLength: config.apiKey.length
    });

    const body: RequestBody = await req.json();
    console.log('Request body:', body);

    // Authenticate with Odoo
    const uid = await authenticateOdoo(config);

    let result;

    switch (body.action) {
      case 'search':
        if (!body.searchTerm) {
          throw new Error('Search term is required for search action');
        }
        result = await searchContacts(config, uid, body.searchTerm);
        break;

      case 'create':
        if (!body.contactData) {
          throw new Error('Contact data is required for create action');
        }
        result = await createContact(config, uid, body.contactData);
        break;

      case 'update':
        if (!body.contactId || !body.contactData) {
          throw new Error('Contact ID and contact data are required for update action');
        }
        result = await updateContact(config, uid, body.contactId, body.contactData);
        break;

      default:
        throw new Error(`Invalid action: ${body.action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error in manage-odoo-contact function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unknown error occurred' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
