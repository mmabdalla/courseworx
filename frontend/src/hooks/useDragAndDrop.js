import { useQueryClient } from 'react-query';
import { courseContentAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useDragAndDrop = (courseId, sectionsData, contentData) => {
  const queryClient = useQueryClient();

  const handleDragEnd = async (result) => {
    console.log('🎯 Drag ended:', result);
    
    const { destination, source, draggableId, type } = result;

    // If dropped outside a droppable area
    if (!destination) {
      console.log('❌ No destination - drag cancelled');
      return;
    }

    // If dropped in the same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      console.log('❌ Same position - no change needed');
      return;
    }

    console.log('✅ Valid drag operation:', {
      type,
      from: `${source.droppableId}[${source.index}]`,
      to: `${destination.droppableId}[${destination.index}]`,
      draggableId
    });

    if (type === 'content') {
      const contentId = draggableId;
      const destSectionId = destination.droppableId;

      console.log('🔄 Moving content:', {
        contentId,
        destSectionId,
        destIndex: destination.index
      });

      // Validate that the destination droppable exists
      if (destSectionId !== 'uncategorized' && !sectionsData.sections.find(s => s.id === destSectionId)) {
        console.error('❌ Invalid destination droppable:', destSectionId);
        toast.error('Invalid drop target');
        return;
      }

      // Find the content being moved
      const contentToMove = contentData.contents.find(c => c.id === contentId);
      if (!contentToMove) {
        console.error('❌ Content not found:', contentId);
        toast.error('Content not found');
        return;
      }

      // Update content's section and order
      try {
        await courseContentAPI.update(courseId, contentId, {
          sectionId: destSectionId === 'uncategorized' ? null : destSectionId,
          order: destination.index
        });

        // Reorder other content in destination section if needed
        const destContents = contentData.contents.filter(c => 
          destSectionId === 'uncategorized' ? !c.sectionId : c.sectionId === destSectionId
        );
        
        // Update orders for content in destination section
        for (let i = 0; i < destContents.length; i++) {
          if (destContents[i].id !== contentId) {
            await courseContentAPI.update(courseId, destContents[i].id, { order: i });
          }
        }

        queryClient.invalidateQueries(['course-content', courseId]);
        queryClient.invalidateQueries(['course-sections', courseId]);
        toast.success('Content moved successfully!');
      } catch (error) {
        console.error('❌ Failed to move content:', error);
        toast.error('Failed to move content');
      }
    }
  };

  // Helper function to get content for a section
  const getContentForSection = (sectionId) => {
    if (!contentData?.contents) return [];
    
    if (sectionId === 'uncategorized') {
      return contentData.contents.filter(content => !content.sectionId);
    }
    
    return contentData.contents.filter(content => content.sectionId === sectionId);
  };

  return {
    handleDragEnd,
    getContentForSection
  };
};
