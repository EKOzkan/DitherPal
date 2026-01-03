import { useState } from 'react'

export const useCollapsibleSections = (initialState = {}) => {
  const [expandedSections, setExpandedSections] = useState(initialState)

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const expandSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: true
    }))
  }

  const collapseSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: false
    }))
  }

  return {
    expandedSections,
    toggleSection,
    expandSection,
    collapseSection
  }
}
