/**
 * ISO 20022 payment instruction and status report utilities
 * Supports real pain.001 XML format and simplified JSON format
 */

import { isAddress } from 'viem'
import { XMLParser } from 'fast-xml-parser'

// ============================================================================
// Type Definitions
// ============================================================================

export interface PaymentInstruction {
  messageId: string
  creationDateTime: string
  numberOfTransactions: number
  controlSum: number
  initiator: {
    name: string
    id: string
  }
  payments: Payment[]
  feeToken: `0x${string}`
}

export interface Payment {
  id: string
  employee: {
    name?: string
    address: `0x${string}`
    employeeId: string
  }
  amount: string
  currency: string
  token: `0x${string}`
  memo?: string
}

export interface PaymentStatusReport {
  messageId: string
  creationDateTime: string
  originalMessageId: string
  status: 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'FAILED'
  numberOfTransactions: number
  numberOfSuccessful: number
  numberOfFailed: number
  totalAmountProcessed: string
  totalFeesPaid: string
  executionTime: string
  payments: PaymentResult[]
}

export interface PaymentResult {
  id: string
  status: 'COMPLETED' | 'FAILED' | 'PENDING'
  employee: {
    name: string
    address: string
  }
  amount: string
  transactionHash?: string
  blockNumber?: number
  timestamp?: string
  explorerUrl?: string
  gasUsed?: string
  errorCode?: string
  errorMessage?: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  code: string
  message: string
  paymentId?: string
  field?: string
}

export interface ValidationWarning {
  code: string
  message: string
  paymentId?: string
}

// ============================================================================
// Parsing and Validation
// ============================================================================

/**
 * Parse pain.001 file (XML or JSON format)
 */
export function parsePain001(content: string): PaymentInstruction {
  try {
    // Try to detect if it's XML or JSON
    const trimmed = content.trim()
    
    if (trimmed.startsWith('<?xml') || trimmed.startsWith('<Document')) {
      return parseXMLPain001(content)
    } else {
      return parseJSONPain001(content)
    }
  } catch (error) {
    throw new Error(`Failed to parse payment instruction: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Parse real pain.001 XML file
 */
function parseXMLPain001(xml: string): PaymentInstruction {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseTagValue: false, // Don't auto-parse values (keeps hex addresses as strings)
    parseAttributeValue: true,
    trimValues: true,
    alwaysCreateTextNode: true, // Preserve text content
  })
  
  const parsed = parser.parse(xml)
  
  if (!parsed.Document || !parsed.Document.CstmrCdtTrfInitn) {
    throw new Error('Invalid pain.001 XML format: Missing Document/CstmrCdtTrfInitn')
  }
  
  const doc = parsed.Document.CstmrCdtTrfInitn
  const grpHdr = doc.GrpHdr
  const pmtInf = doc.PmtInf
  
  if (!grpHdr || !pmtInf) {
    throw new Error('Invalid pain.001 XML format: Missing GrpHdr or PmtInf')
  }
  
  // Parse payments
  const cdtTrfTxInfArray = Array.isArray(pmtInf.CdtTrfTxInf) 
    ? pmtInf.CdtTrfTxInf 
    : [pmtInf.CdtTrfTxInf]
  
  const payments: Payment[] = cdtTrfTxInfArray.map((txn: any, index: number) => {
    // Payment ID handling - extract from object if needed
    const paymentIdValue = txn.PmtId?.EndToEndId
    const paymentId = typeof paymentIdValue === 'string'
      ? paymentIdValue
      : typeof paymentIdValue === 'object' && paymentIdValue !== null && '#text' in paymentIdValue
        ? String(paymentIdValue['#text'])
        : `PAY-${index + 1}`
    
    // Amount handling - simpler since parseTagValue is false
    const amountValue = txn.Amt?.InstdAmt
    const amount = typeof amountValue === 'string' 
      ? amountValue 
      : typeof amountValue === 'object' && amountValue !== null && '#text' in amountValue
        ? String(amountValue['#text'])
        : String(amountValue || '0')
    const currency = txn.Amt?.InstdAmt?.['@_Ccy'] || 'USD'
    
    // Address handling - preserve as string (critical fix)
    const addressValue = txn.CdtrAcct?.Id?.Othr?.Id
    const address = typeof addressValue === 'string' 
      ? addressValue.trim()
      : typeof addressValue === 'object' && addressValue !== null && '#text' in addressValue
        ? String(addressValue['#text']).trim()
        : String(addressValue || '').trim()
    
    // Employee name handling
    const employeeNameValue = txn.Cdtr?.Nm
    const employeeName = typeof employeeNameValue === 'string'
      ? employeeNameValue
      : typeof employeeNameValue === 'object' && employeeNameValue !== null && '#text' in employeeNameValue
        ? String(employeeNameValue['#text'])
        : `Employee ${paymentId}`
    
    // Memo handling
    const memoValue = txn.RmtInf?.Ustrd
    const memo = typeof memoValue === 'string'
      ? memoValue
      : typeof memoValue === 'object' && memoValue !== null && '#text' in memoValue
        ? String(memoValue['#text'])
        : ''
    
    return {
      id: String(paymentId),
      employee: {
        name: employeeName,
        address: address as `0x${string}`,
        employeeId: String(paymentId),
      },
      amount,
      currency,
      token: '0x20c0000000000000000000000000000000000001' as `0x${string}`, // Default to AlphaUSD
      memo,
    }
  })
  
  // Extract values that might be objects
  const msgIdValue = grpHdr.MsgId
  const messageId = typeof msgIdValue === 'string' 
    ? msgIdValue 
    : typeof msgIdValue === 'object' && msgIdValue !== null && '#text' in msgIdValue
      ? String(msgIdValue['#text'])
      : 'UNKNOWN'
  
  const ctrlSumValue = grpHdr.CtrlSum
  const controlSum = typeof ctrlSumValue === 'string' || typeof ctrlSumValue === 'number'
    ? parseFloat(String(ctrlSumValue))
    : typeof ctrlSumValue === 'object' && ctrlSumValue !== null && '#text' in ctrlSumValue
      ? parseFloat(String(ctrlSumValue['#text']))
      : 0
  
  const nbOfTxsValue = grpHdr.NbOfTxs
  const numberOfTransactions = typeof nbOfTxsValue === 'string' || typeof nbOfTxsValue === 'number'
    ? parseInt(String(nbOfTxsValue))
    : typeof nbOfTxsValue === 'object' && nbOfTxsValue !== null && '#text' in nbOfTxsValue
      ? parseInt(String(nbOfTxsValue['#text']))
      : payments.length
  
  const creDtTmValue = grpHdr.CreDtTm
  const creationDateTime = typeof creDtTmValue === 'string'
    ? creDtTmValue
    : typeof creDtTmValue === 'object' && creDtTmValue !== null && '#text' in creDtTmValue
      ? String(creDtTmValue['#text'])
      : new Date().toISOString()
  
  const initiatorNameValue = grpHdr.InitgPty?.Nm
  const initiatorName = typeof initiatorNameValue === 'string'
    ? initiatorNameValue
    : typeof initiatorNameValue === 'object' && initiatorNameValue !== null && '#text' in initiatorNameValue
      ? String(initiatorNameValue['#text'])
      : 'Unknown'
  
  return {
    messageId,
    creationDateTime,
    numberOfTransactions,
    controlSum,
    initiator: {
      name: initiatorName,
      id: grpHdr.InitgPty?.Id?.OrgId?.Othr?.Id || 'UNKNOWN',
    },
    payments,
    feeToken: '0x20c0000000000000000000000000000000000001' as `0x${string}`, // Default to AlphaUSD
  }
}

/**
 * Parse JSON pain.001 file (simplified format)
 */
function parseJSONPain001(json: string): PaymentInstruction {
  const data = JSON.parse(json)
  
  // Basic structure validation
  if (!data.messageId || !data.payments || !Array.isArray(data.payments)) {
    throw new Error('Invalid JSON payment instruction format')
  }
  
  return data as PaymentInstruction
}

/**
 * Validate payment instruction
 */
export function validatePaymentInstruction(
  instruction: PaymentInstruction,
  availableBalance: string
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Only validate critical things that would cause execution to fail
  if (!instruction.payments || instruction.payments.length === 0) {
    errors.push({
      code: 'NO_PAYMENTS',
      message: 'At least one payment is required',
    })
  }

  // Validate total against available balance (critical - prevents execution failure)
  const actualSum = instruction.payments.reduce(
    (sum, p) => sum + parseFloat(p.amount),
    0
  )
  const balance = parseFloat(availableBalance)
  
  if (actualSum > balance) {
    errors.push({
      code: 'INSUFFICIENT_BALANCE',
      message: `Insufficient balance: need ${actualSum.toFixed(2)}, have ${balance.toFixed(2)}`,
    })
  }

  // Everything else is just warnings (not blocking)
  const addressSet = new Set<string>()
  
  for (const payment of instruction.payments) {
    const address = String(payment.employee.address || '').trim()
    
    // Warn on duplicate addresses (not an error - might be intentional)
    const addressLower = address.toLowerCase()
    if (addressSet.has(addressLower)) {
      warnings.push({
        code: 'DUPLICATE_ADDRESS',
        message: `Duplicate payment to address ${address}`,
        paymentId: payment.id,
      })
    }
    addressSet.add(addressLower)

    // Warn on unusual amounts (not blocking)
    const amount = parseFloat(payment.amount)
    if (isNaN(amount) || amount <= 0) {
      warnings.push({
        code: 'INVALID_AMOUNT',
        message: `Invalid amount: ${payment.amount}`,
        paymentId: payment.id,
      })
    }

    if (amount > 100000) {
      warnings.push({
        code: 'LARGE_AMOUNT',
        message: `Unusually large payment amount: ${payment.amount}`,
        paymentId: payment.id,
      })
    }

    if (amount < 1) {
      warnings.push({
        code: 'SMALL_AMOUNT',
        message: `Unusually small payment amount: ${payment.amount}`,
        paymentId: payment.id,
      })
    }

    // Warn on missing optional fields
    if (!payment.memo) {
      warnings.push({
        code: 'MISSING_MEMO',
        message: 'Payment memo is recommended for tracking',
        paymentId: payment.id,
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// ============================================================================
// Status Report Generation
// ============================================================================

/**
 * Generate pain.002-inspired status report
 */
export function generatePain002(
  originalInstruction: PaymentInstruction,
  results: PaymentResult[],
  executionTimeMs: number,
  totalFees: string
): PaymentStatusReport {
  const numberOfSuccessful = results.filter(r => r.status === 'COMPLETED').length
  const numberOfFailed = results.filter(r => r.status === 'FAILED').length

  const totalAmountProcessed = results
    .filter(r => r.status === 'COMPLETED')
    .reduce((sum, r) => sum + parseFloat(r.amount), 0)

  let status: 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'FAILED'
  if (numberOfSuccessful === results.length) {
    status = 'COMPLETED'
  } else if (numberOfSuccessful > 0) {
    status = 'PARTIALLY_COMPLETED'
  } else {
    status = 'FAILED'
  }

  return {
    messageId: `STATUS-${originalInstruction.messageId}`,
    creationDateTime: new Date().toISOString(),
    originalMessageId: originalInstruction.messageId,
    status,
    numberOfTransactions: results.length,
    numberOfSuccessful,
    numberOfFailed,
    totalAmountProcessed: totalAmountProcessed.toFixed(2),
    totalFeesPaid: totalFees,
    executionTime: `${(executionTimeMs / 1000).toFixed(1)}s`,
    payments: results,
  }
}

/**
 * Export status report to CSV format for accounting systems
 */
export function exportToCSV(report: PaymentStatusReport): string {
  const headers = [
    'Payment ID',
    'Employee Name',
    'Employee Address',
    'Amount',
    'Status',
    'Transaction Hash',
    'Block Number',
    'Timestamp',
    'Gas Used',
    'Error Message',
    'Explorer URL',
  ]

  const rows = report.payments.map(p => [
    p.id,
    p.employee.name,
    p.employee.address,
    p.amount,
    p.status,
    p.transactionHash || '',
    p.blockNumber?.toString() || '',
    p.timestamp || '',
    p.gasUsed || '',
    p.errorMessage || '',
    p.explorerUrl || '',
  ])

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n')

  return csv
}

/**
 * Generate pain.002 XML format (ISO 20022 standard)
 */
export function generatePain002XML(report: PaymentStatusReport): string {
  const statusCode = report.status === 'COMPLETED' ? 'ACCP' : 
                     report.status === 'PARTIALLY_COMPLETED' ? 'PART' : 'RJCT'
  
  const payments = report.payments.map(p => {
    if (p.status === 'COMPLETED') {
      return `      <TxInfAndSts>
        <OrgnlEndToEndId>${p.id}</OrgnlEndToEndId>
        <TxSts>ACCP</TxSts>
        <AccptncDtTm>${p.timestamp}</AccptncDtTm>
        <StsRsnInf>
          <AddtlInf>Transaction Hash: ${p.transactionHash}</AddtlInf>
          <AddtlInf>Block Number: ${p.blockNumber}</AddtlInf>
          <AddtlInf>Explorer: ${p.explorerUrl}</AddtlInf>
        </StsRsnInf>
      </TxInfAndSts>`
    } else {
      return `      <TxInfAndSts>
        <OrgnlEndToEndId>${p.id}</OrgnlEndToEndId>
        <TxSts>RJCT</TxSts>
        <StsRsnInf>
          <Rsn>
            <Cd>${p.errorCode}</Cd>
          </Rsn>
          <AddtlInf>${p.errorMessage}</AddtlInf>
        </StsRsnInf>
      </TxInfAndSts>`
    }
  }).join('\n')
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.002.001.03">
  <CstmrPmtStsRpt>
    <GrpHdr>
      <MsgId>${report.messageId}</MsgId>
      <CreDtTm>${report.creationDateTime}</CreDtTm>
    </GrpHdr>
    <OrgnlGrpInfAndSts>
      <OrgnlMsgId>${report.originalMessageId}</OrgnlMsgId>
      <OrgnlMsgNmId>pain.001.001.03</OrgnlMsgNmId>
      <GrpSts>${statusCode}</GrpSts>
    </OrgnlGrpInfAndSts>
    <OrgnlPmtInfAndSts>
      <OrgnlPmtInfId>${report.originalMessageId}</OrgnlPmtInfId>
      <PmtInfSts>${statusCode}</PmtInfSts>
      <NbOfTxsPerSts>
        <DtldNbOfTxs>${report.numberOfSuccessful}</DtldNbOfTxs>
        <DtldSts>ACCP</DtldSts>
      </NbOfTxsPerSts>
      <NbOfTxsPerSts>
        <DtldNbOfTxs>${report.numberOfFailed}</DtldNbOfTxs>
        <DtldSts>RJCT</DtldSts>
      </NbOfTxsPerSts>
${payments}
    </OrgnlPmtInfAndSts>
  </CstmrPmtStsRpt>
</Document>`
}

/**
 * Download file helper
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

