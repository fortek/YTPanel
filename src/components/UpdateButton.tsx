import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function UpdateButton() {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch('/api/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()

      if (!response.ok) {
        console.log('Update error:', data)
        if (data.error === 'Git is not installed') {
          toast.error('Git не установлен', {
            description: React.createElement('div', { className: 'mt-2' },
              React.createElement('p', null, 'Для работы обновления требуется установить Git.'),
              React.createElement('p', { className: 'mt-2' },
                '1. Скачайте Git с официального сайта: ',
                React.createElement('a', {
                  href: 'https://git-scm.com/downloads',
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  className: 'text-blue-400 hover:text-blue-300 underline'
                }, 'git-scm.com/downloads')
              ),
              React.createElement('p', { className: 'mt-1' }, '2. Установите Git, следуя инструкциям установщика'),
              React.createElement('p', { className: 'mt-1' }, '3. Перезапустите приложение')
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
      console.error('Update request error:', error)
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