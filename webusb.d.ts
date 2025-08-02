// webusb.d.ts
interface Navigator {
    usb: USB
  }
  
  interface USB {
    requestDevice(options: USBDeviceRequestOptions): Promise<USBDevice>
    getDevices(): Promise<USBDevice[]>
    // Add other USB methods here if needed
  }
  
  interface USBDeviceRequestOptions {
    filters: USBDeviceFilter[]
  }
  
  interface USBDeviceFilter {
    vendorId?: number
    productId?: number
  }
  
  interface USBDevice {
    vendorId: number
    productId: number
    productName?: string
    manufacturerName?: string
    serialNumber?: string
    configuration?: USBConfiguration
    open(): Promise<void>
    selectConfiguration(configurationValue: number): Promise<void>
    claimInterface(interfaceNumber: number): Promise<void>
    transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>
  }
  
  interface USBConfiguration {
    configurationValue: number
    interfaces: USBInterface[]
  }
  
  interface USBInterface {
    interfaceNumber: number
    alternates: any[]
  }
  
  interface USBOutTransferResult {
    status: 'ok' | 'stall' | 'babble'
    bytesWritten: number
  }
  