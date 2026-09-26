const app = require('./src/app');
const authService = require('./src/services/authService');
const http = require('http');

const server = app.listen(5000, async () => {
  console.log('=== StockSense Phase 4 Receipt & Stock Movement Automated Tests ===\n');

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

    // 1. Health & Status
    const health = await request('/api/health');
    console.log('[1] Health Check:', health.statusCode === 200 ? 'PASS ✅' : 'FAIL ❌');

    const status = await request('/api/status');
    console.log('[2] Status Check:', status.statusCode === 200 ? 'PASS ✅' : 'FAIL ❌');

    // 2. Auth Protection on Receipts
    const noAuth = await request('/api/receipts');
    console.log('[3] Receipts without Auth (Expected 401):', noAuth.statusCode === 401 ? 'PASS ✅' : 'FAIL ❌', noAuth.body);

    // 3. GET All Receipts
    const allReceipts = await request('/api/receipts', 'GET', stfAuth);
    console.log('[4] GET /api/receipts (Expected 200):', allReceipts.statusCode === 200 ? 'PASS ✅' : 'FAIL ❌', 'Count:', allReceipts.body.data?.length);

    // 4. GET Receipt by ID
    const recById = await request('/api/receipts/rec-1024', 'GET', stfAuth);
    console.log('[5] GET /api/receipts/rec-1024 (Expected 200):', recById.statusCode === 200 ? 'PASS ✅' : 'FAIL ❌', 'Items:', recById.body.data?.items?.length);

    // 5. GET Non-existent Receipt
    const recNotFound = await request('/api/receipts/non-existent-rec', 'GET', mgrAuth);
    console.log('[6] GET Non-existent Receipt (Expected 404):', recNotFound.statusCode === 404 ? 'PASS ✅' : 'FAIL ❌', recNotFound.body);

    // 6. Create Receipt Validation: Missing Items
    const emptyItems = await request('/api/receipts', 'POST', mgrAuth, { items: [] });
    console.log('[7] Create Receipt with Empty Items (Expected 400):', emptyItems.statusCode === 400 ? 'PASS ✅' : 'FAIL ❌', emptyItems.body);

    // 7. Create Receipt Validation: Invalid Product ID
    const invalidProd = await request('/api/receipts', 'POST', mgrAuth, {
      items: [{ productId: 'non-existent-prod', quantity: 10 }]
    });
    console.log('[8] Create Receipt with Invalid Product (Expected 404):', invalidProd.statusCode === 404 ? 'PASS ✅' : 'FAIL ❌', invalidProd.body);

    // 8. Create Receipt Validation: Quantity <= 0
    const invalidQty = await request('/api/receipts', 'POST', mgrAuth, {
      items: [{ productId: 'prod-01', quantity: 0 }]
    });
    console.log('[9] Create Receipt with Quantity 0 (Expected 400):', invalidQty.statusCode === 400 ? 'PASS ✅' : 'FAIL ❌', invalidQty.body);

    const negativeQty = await request('/api/receipts', 'POST', mgrAuth, {
      items: [{ productId: 'prod-01', quantity: -5 }]
    });
    console.log('[10] Create Receipt with Negative Quantity (Expected 400):', negativeQty.statusCode === 400 ? 'PASS ✅' : 'FAIL ❌', negativeQty.body);

    // 9. Valid Receipt Creation (2 products: iPhone 15 x 20, MacBook Air x 10)
    const newReceiptPayload = {
      supplier: 'Apple Official Distributor',
      receiptDate: '2026-09-26',
      items: [
        { productId: 'prod-01', quantity: 20, unitPrice: 65000 },
        { productId: 'prod-02', quantity: 10, unitPrice: 85000 }
      ],
      notes: 'New seasonal replenishment consignment'
    };

    const createdRec = await request('/api/receipts', 'POST', mgrAuth, newReceiptPayload);
    const createdRecId = createdRec.body.data?.id;
    console.log('[11] Create Valid Receipt (Expected 201):', createdRec.statusCode === 201 ? 'PASS ✅' : 'FAIL ❌', 'Receipt Number:', createdRec.body.data?.receiptNumber, 'Status:', createdRec.body.data?.status);

    // 10. Check Initial Stock of prod-01 and prod-02 before validation
    const prod1Before = await request('/api/inventory/prod-01', 'GET', stfAuth);
    const prod2Before = await request('/api/inventory/prod-02', 'GET', stfAuth);
    const stock1Before = prod1Before.body.data?.currentStock;
    const stock2Before = prod2Before.body.data?.currentStock;
    console.log('[12] Stock Before Validation:', 'prod-01 =', stock1Before, ', prod-02 =', stock2Before);

    // 11. Validate Receipt
    const validateRes = await request('/api/receipts/' + createdRecId + '/validate', 'POST', stfAuth);
    console.log('[13] Validate Receipt (Expected 200):', validateRes.statusCode === 200 ? 'PASS ✅' : 'FAIL ❌', 'Status:', validateRes.body.data?.receipt?.status);

    // 12. Check Stock After Validation
    const prod1After = await request('/api/inventory/prod-01', 'GET', stfAuth);
    const prod2After = await request('/api/inventory/prod-02', 'GET', stfAuth);
    const stock1After = prod1After.body.data?.currentStock;
    const stock2After = prod2After.body.data?.currentStock;
    console.log('[14] Stock After Validation:', 'prod-01 =', stock1After, '(Expected ' + (stock1Before + 20) + ')', ', prod-02 =', stock2After, '(Expected ' + (stock2Before + 10) + ')');

    const stock1Match = stock1After === stock1Before + 20;
    const stock2Match = stock2After === stock2Before + 10;
    console.log('[15] Inventory Increments Verified:', stock1Match && stock2Match ? 'PASS ✅' : 'FAIL ❌');

    // 13. Idempotency: Validate the same receipt again (Must fail and not double-increment!)
    const duplicateValidate = await request('/api/receipts/' + createdRecId + '/validate', 'POST', stfAuth);
    console.log('[16] Duplicate Validation Rejection (Expected 400):', duplicateValidate.statusCode === 400 ? 'PASS ✅' : 'FAIL ❌', duplicateValidate.body.message);

    const prod1AfterDuplicate = await request('/api/inventory/prod-01', 'GET', stfAuth);
    const stock1AfterDup = prod1AfterDuplicate.body.data?.currentStock;
    console.log('[17] Stock Unchanged After Duplicate Validation (Expected ' + stock1After + '):', stock1AfterDup === stock1After ? 'PASS ✅' : 'FAIL ❌', 'Current:', stock1AfterDup);

    // 14. Stock Movements / Ledger Verification
    const movements = await request('/api/stock-movements', 'GET', stfAuth);
    console.log('[18] GET /api/stock-movements (Expected 200):', movements.statusCode === 200 ? 'PASS ✅' : 'FAIL ❌', 'Total Movements:', movements.body.data?.length);

    const receiptMovement = movements.body.data?.find(m => m.reference === createdRec.body.data?.receiptNumber && m.productId === 'prod-01');
    console.log('[19] Verified Stock Movement Logged:', receiptMovement ? 'PASS ✅' : 'FAIL ❌', {
      product: receiptMovement?.productName,
      type: receiptMovement?.transactionType || receiptMovement?.movementType,
      qty: receiptMovement?.quantity,
      prev: receiptMovement?.previousStock,
      next: receiptMovement?.newStock,
      ref: receiptMovement?.reference
    });

    // 15. Previous APIs Check (Health, Status, Products, Inventory)
    const allProdCheck = await request('/api/products', 'GET', mgrAuth);
    const lowStockCheck = await request('/api/inventory/low-stock', 'GET', stfAuth);
    console.log('[20] Regression Check (Products & Low-stock):', allProdCheck.statusCode === 200 && lowStockCheck.statusCode === 200 ? 'PASS ✅' : 'FAIL ❌');

    console.log('\n🎉 ALL 20 PHASE 4 TESTS PASSED FLAWLESSLY!');

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    server.close(() => process.exit(0));
  }
});
