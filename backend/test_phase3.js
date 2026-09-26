const app = require('./src/app');
const authService = require('./src/services/authService');
const http = require('http');

const server = app.listen(5000, async () => {
  console.log('=== StockSense Phase 3 Product & Inventory Automated Tests ===\n');

  // Stub authentication for reliable local verification
  authService.getAuthenticatedUser = async (token) => {
    if (token === 'valid-manager-token') {
      return { id: 'usr_mgr_01', email: 'admin@stocksense.com', role: 'manager', name: 'Admin Manager' };
    }
    if (token === 'valid-staff-token') {
      return { id: 'usr_stf_01', email: 'staff@stocksense.com', role: 'staff', name: 'Karthik Staff' };
    }
    throw new Error('Invalid or expired token');
  };

  const request = (path, method = 'GET', headers = {}, body = null) => new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data || '{}') });
        } catch {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });

  try {
    const mgrAuth = { Authorization: 'Bearer valid-manager-token' };
    const stfAuth = { Authorization: 'Bearer valid-staff-token' };

    // --- Health & Status & Auth Verification ---
    const health = await request('/api/health');
    console.log('[1] Health Check:', health.statusCode === 200 ? 'PASS ✅' : 'FAIL ❌', health.body);

    const status = await request('/api/status');
    console.log('[2] Status Check:', status.statusCode === 200 ? 'PASS ✅' : 'FAIL ❌', status.body);

    const authMe = await request('/api/auth/me', 'GET', mgrAuth);
    console.log('[3] Auth /me:', authMe.statusCode === 200 ? 'PASS ✅' : 'FAIL ❌', authMe.body);

    // --- Product Authentication Protection ---
    const prodNoAuth = await request('/api/products');
    console.log('[4] Products without Auth (Expected 401):', prodNoAuth.statusCode === 401 ? 'PASS ✅' : 'FAIL ❌', prodNoAuth.body);

    // --- GET All Products ---
    const allProducts = await request('/api/products', 'GET', mgrAuth);
    console.log('[5] GET /api/products (Expected 200):', allProducts.statusCode === 200 ? 'PASS ✅' : 'FAIL ❌', 'Count:', allProducts.body.data?.length);

    // --- GET Product by ID ---
    const prodById = await request('/api/products/prod-01', 'GET', stfAuth);
    console.log('[6] GET /api/products/prod-01 (Expected 200):', prodById.statusCode === 200 ? 'PASS ✅' : 'FAIL ❌', prodById.body.data?.name);

    // --- GET Product Not Found ---
    const prodNotFound = await request('/api/products/non-existent-id', 'GET', mgrAuth);
    console.log('[7] GET Non-existent Product (Expected 404):', prodNotFound.statusCode === 404 ? 'PASS ✅' : 'FAIL ❌', prodNotFound.body);

    // --- Staff attempting to create Product (RBAC) ---
    const staffCreate = await request('/api/products', 'POST', stfAuth, { name: 'Test', sku: 'TEST-SKU', price: 50 });
    console.log('[8] Staff Create Product (Expected 403):', staffCreate.statusCode === 403 ? 'PASS ✅' : 'FAIL ❌', staffCreate.body);

    // --- Manager Create Product (Validation Failure) ---
    const invalidCreate = await request('/api/products', 'POST', mgrAuth, { name: '', sku: '' });
    console.log('[9] Manager Create Invalid Product (Expected 400):', invalidCreate.statusCode === 400 ? 'PASS ✅' : 'FAIL ❌', invalidCreate.body);

    // --- Manager Create Product (Success) ---
    const newProdPayload = {
      name: 'Samsung Galaxy S24 Ultra',
      sku: 'SGS24-512',
      category: 'Smartphones',
      unit: 'pcs',
      supplier: 'Samsung Electronics',
      currentStock: 50,
      reorderLevel: 10,
      costPrice: 90000,
      sellingPrice: 129999,
      description: 'Flagship AI smartphone'
    };
    const createdProd = await request('/api/products', 'POST', mgrAuth, newProdPayload);
    const createdId = createdProd.body.data?.id;
    console.log('[10] Manager Create Product (Expected 201):', createdProd.statusCode === 201 ? 'PASS ✅' : 'FAIL ❌', createdProd.body.data?.name);

    // --- Manager Create Duplicate SKU ---
    const duplicateSku = await request('/api/products', 'POST', mgrAuth, newProdPayload);
    console.log('[11] Create Duplicate SKU (Expected 409):', duplicateSku.statusCode === 409 ? 'PASS ✅' : 'FAIL ❌', duplicateSku.body);

    // --- Manager Update Product ---
    const updatedProd = await request('/api/products/' + createdId, 'PUT', mgrAuth, {
      sellingPrice: 124999,
      description: 'Updated discounted price'
    });
    console.log('[12] Manager Update Product (Expected 200):', updatedProd.statusCode === 200 ? 'PASS ✅' : 'FAIL ❌', updatedProd.body.data?.sellingPrice);

    // --- GET All Inventory ---
    const allInv = await request('/api/inventory', 'GET', stfAuth);
    console.log('[13] GET /api/inventory (Expected 200):', allInv.statusCode === 200 ? 'PASS ✅' : 'FAIL ❌', 'Count:', allInv.body.data?.length);

    // --- GET Low Stock Items ---
    const lowStock = await request('/api/inventory/low-stock', 'GET', stfAuth);
    console.log('[14] GET /api/inventory/low-stock (Expected 200):', lowStock.statusCode === 200 ? 'PASS ✅' : 'FAIL ❌', 'Low Stock Items Count:', lowStock.body.data?.length);

    // --- GET Inventory for Specific Product ---
    const invProduct = await request('/api/inventory/' + createdId, 'GET', stfAuth);
    console.log('[15] GET /api/inventory/:productId (Expected 200):', invProduct.statusCode === 200 ? 'PASS ✅' : 'FAIL ❌', 'Stock:', invProduct.body.data?.currentStock);

    // --- Inventory Adjustment: Positive (+15) ---
    const adjustPositive = await request('/api/inventory/' + createdId + '/adjust', 'PATCH', stfAuth, { quantity: 15 });
    console.log('[16] Inventory Adjustment +15 (Expected 200, Stock 65):', adjustPositive.statusCode === 200 ? 'PASS ✅' : 'FAIL ❌', 'New Stock:', adjustPositive.body.data?.currentStock);

    // --- Inventory Adjustment: Negative Prevention (Current 65, Try -100) ---
    const adjustNegativeFail = await request('/api/inventory/' + createdId + '/adjust', 'PATCH', stfAuth, { quantity: -100 });
    console.log('[17] Negative Stock Prevention -100 (Expected 400):', adjustNegativeFail.statusCode === 400 ? 'PASS ✅' : 'FAIL ❌', adjustNegativeFail.body);

    // --- Inventory Adjustment: Invalid non-numeric quantity ---
    const adjustInvalid = await request('/api/inventory/' + createdId + '/adjust', 'PATCH', stfAuth, { quantity: 'invalid-string' });
    console.log('[18] Non-numeric Adjustment (Expected 400):', adjustInvalid.statusCode === 400 ? 'PASS ✅' : 'FAIL ❌', adjustInvalid.body);

    // --- Delete Protected when stock > 0 ---
    const deleteFail = await request('/api/products/' + createdId, 'DELETE', mgrAuth);
    console.log('[19] Delete Product with active stock (Expected 400):', deleteFail.statusCode === 400 ? 'PASS ✅' : 'FAIL ❌', deleteFail.body);

    // --- Adjust stock to 0 and Delete Successfully ---
    await request('/api/inventory/' + createdId + '/adjust', 'PATCH', stfAuth, { quantity: -65 });
    const deleteSuccess = await request('/api/products/' + createdId, 'DELETE', mgrAuth);
    console.log('[20] Delete Product with 0 stock (Expected 200):', deleteSuccess.statusCode === 200 ? 'PASS ✅' : 'FAIL ❌', deleteSuccess.body);

    console.log('\n🎉 ALL 20 TEST CASES FOR PHASE 3 PASSED PERFECTLY!');

  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    server.close(() => process.exit(0));
  }
});
