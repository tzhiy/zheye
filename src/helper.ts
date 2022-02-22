import { ColumnProps } from './store'
export function generateFitUrl(column: ColumnProps, width: number, height: number) {
  if (column.avatar) {
    column.avatar.fitUrl = column.avatar.url + `?x-oss-process=image/resize,m_pad,h_${height},w_${width}`
  } else {
    column.avatar = {
      fitUrl: require('@/assets/column.jpg')
    }
  }
}

interface CheckCondition {
  format?: string[]
  size?: number // 单位 M
}
type ErrorType = 'size' | 'format' | null
// 上传文件前检查文件信息
export function beforeUploadCheck(file: File, condition: CheckCondition) {
  const { format, size } = condition
  const isVaildFormat = format ? format.includes(file.type) : true
  const isVaildSize = size ? (file.size / 1024 / 1024 < size) : true
  let error: ErrorType = null
  if (!isVaildFormat) {
    error = 'format'
  } else if (!isVaildSize) {
    error = 'size'
  }
  return {
    passed: isVaildFormat && isVaildSize,
    error
  }
}
