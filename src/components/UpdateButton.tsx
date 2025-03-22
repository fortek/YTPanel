import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function UpdateButton() {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch('/api/update', {
        method: 'POST'
      })
      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'Git is not installed') {
          toast.error('Git не установлен', {
            description: (
              <div className="mt-2">
                <p>Для работы обновления требуется установить Git.</p>
                <p className="mt-2">
                  1. Скачайте Git с официального сайта:{' '}
                  <a 
                    href="https://git-scm.com/downloads" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    git-scm.com/downloads
                  </a>
                </p>
                <p className="mt-1">2. Установите Git, следуя инструкциям установщика</p>
                <p className="mt-1">3. Перезапустите приложение</p>
              </div>
            ),
            duration: 10000
          })
        } else {
          toast.error('Ошибка обновления', {
            description: data.details || data.error
          })
        }
        return
      }

      toast.success('Успешно!', {
        description: data.message
      })
    } catch (error) {
      toast.error('Ошибка обновления', {
        description: 'Не удалось подключиться к серверу'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleUpdate} 
      disabled={isUpdating}
      className="relative"
    >
      {isUpdating && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      )}
      {isUpdating ? 'Обновление...' : 'Обновить'}
    </Button>
  )
} 