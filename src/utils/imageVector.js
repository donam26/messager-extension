import * as tf from '@tensorflow/tfjs';
import { pipeline } from '@xenova/transformers';

let imageModel = null;

export async function initializeModels() {
  try {
    // Khởi tạo model CLIP
    imageModel = await pipeline('feature-extraction', 'Xenova/clip-vit-base-patch32');
    console.log('Đã khởi tạo mô hình thành công');
  } catch (error) {
    console.error('Lỗi khi khởi tạo mô hình:', error);
    // Thông báo lỗi cho người dùng
    alert('Có lỗi xảy ra khi khởi tạo mô hình. Vui lòng thử lại sau.');
  }
}

export async function convert2Vector(imageUrl) {
  if (!imageModel) {
    console.error('Mô hình chưa được khởi tạo');
    return null;
  }

  try {
    // Tải và xử lý hình ảnh
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Chuyển đổi hình ảnh thành vector
    const output = await imageModel(blob, { pooling: 'mean' });
    
    return {
      success: true,
      data: output
    };
  } catch (error) {
    console.error('Lỗi khi chuyển đổi hình ảnh:', error);
    return {
      success: false,
      error: error.message
    };
  }
} 