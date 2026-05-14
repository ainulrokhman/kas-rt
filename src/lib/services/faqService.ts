import { FaqRepository } from "../repositories/faqRepository";
import { Faq, FaqCategory } from "@/types/faq";
import { JabatanPetugas } from "@/types/petugas";

export class FaqService {
  /**
   * Mengambil FAQ yang relevan untuk user tertentu.
   * - Public: hanya 'umum'
   * - Pengurus (RT, Sek, Ben): 'umum' + 'pengurus'
   * - Penarik Jimpitan: 'umum' + 'penarik_jimpitan'
   */
  static async getRelevantFaqs(jabatan?: JabatanPetugas): Promise<Faq[]> {
    const categories: FaqCategory[] = ['umum'];

    if (jabatan) {
      if (jabatan === 'Ketua RT' || jabatan === 'Sekretaris' || jabatan === 'Bendahara') {
        categories.push('pengurus');
      } else if (jabatan === 'Penarik Jimpitan') {
        categories.push('penarik_jimpitan');
      }
    }

    const allFaqs: Faq[] = [];
    
    // Fetch each category (in parallel for performance)
    const promises = categories.map(cat => FaqRepository.getByCategory(cat));
    const results = await Promise.all(promises);
    
    results.forEach(faqs => allFaqs.push(...faqs));

    // Sort by order
    return allFaqs.sort((a, b) => a.order - b.order);
  }

  /**
   * Memulai pengamatan (observe) FAQ yang relevan secara real-time.
   */
  static observeRelevantFaqs(
    jabatan: JabatanPetugas | undefined, 
    callback: (data: Faq[]) => void
  ): () => void {
    const categories: FaqCategory[] = ['umum'];

    if (jabatan) {
      if (jabatan === 'Ketua RT' || jabatan === 'Sekretaris' || jabatan === 'Bendahara') {
        categories.push('pengurus');
      } else if (jabatan === 'Penarik Jimpitan') {
        categories.push('penarik_jimpitan');
      }
    }

    const categoryData: Record<string, Faq[]> = {};
    const unsubs: (() => void)[] = [];

    categories.forEach(cat => {
      const unsub = FaqRepository.observeByCategory(cat, (faqs) => {
        categoryData[cat] = faqs;
        
        // Combine all and trigger callback
        const combined = Object.values(categoryData).flat().sort((a, b) => a.order - b.order);
        callback(combined);
      });
      unsubs.push(unsub);
    });

    return () => unsubs.forEach(unsub => unsub());
  }
}
